from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.core.redaction import redactor
from app.core.auditor import auditor
from app.db.supabase import supabase
from app.core.security import get_api_key
from tenacity import retry, stop_after_attempt, wait_exponential
from fastapi_limiter.depends import RateLimiter
import uuid
import json
import redis.asyncio as redis
import os
import redis.asyncio as redis
import redis.asyncio as redis
from app.core.llm_router import llm_router # Import Router
from app.utils.context_builder import build_conversation_context
from app.utils.history_manager import ensure_conversation, add_chat_message

router = APIRouter()

class InterceptRequest(BaseModel):
    payload: Dict[str, Any] = Field(..., description="The JSON payload to be intercepted and audited.")
    source: Optional[str] = Field("api-gateway", description="Origin of the request (e.g., 'mobile-app', 'web-dashboard').")
    policy_id: Optional[str] = Field(None, description="UUID of the specific policy to apply.")
    policy_config: Optional[Dict[str, Any]] = Field(None, description="Dynamic configuration.")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional context like conversation_id.")

class PrivacyReceipt(BaseModel):
    latency_ms: float
    engine: str
    scrubbed_count: int
    policy_id: Optional[str] = "personal-default-v1"

class InterceptResponse(BaseModel):
    status: str = Field(..., description="Processing status.")
    processed_at: datetime = Field(..., description="Timestamp.")
    redacted_payload: Optional[Dict[str, Any]] = Field(None)
    verdict: Optional[str] = Field(None)
    compliance_score: Optional[float] = Field(None)
    reasoning: Optional[str] = Field(None)
    pending_id: Optional[str] = Field(None)
    violation_details: Optional[str] = Field(None)
    receipt: Optional[PrivacyReceipt] = Field(None, description="Privacy Receipt metadata.")
    ai_response: Optional[str] = Field(None, description="The generated response from the LLM (if applicable).")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def log_transaction(payload_raw: Dict, payload_redacted: Dict, audit_result: Any, request_id: str, has_pii: bool, token_usage_override: int = None, bypass_used: bool = False):
    """Background task to log the transaction to Supabase with Retry Logic."""
    try:
        # Check if audit_result is a Pydantic model
        verdict = audit_result.verdict if hasattr(audit_result, 'verdict') else "UNKNOWN"
        score = audit_result.compliance_score if hasattr(audit_result, 'compliance_score') else 0.0
        reasoning = audit_result.reasoning if hasattr(audit_result, 'reasoning') else str(audit_result)

        # Calculate approximate token count or use override
        token_count = token_usage_override if token_usage_override is not None else (len(str(payload_raw)) // 4)
        
        data = {
            "payload_raw": payload_raw, 
            "payload_redacted": payload_redacted,
            "verdict": verdict,
            "compliance_score": score,
            "ai_reasoning": reasoning,
            "has_pii": has_pii,
            "metadata": {
                "source": "api-gateway",
                "request_id": request_id,
                "token_count": token_count,
                "bypass_used": bypass_used
            } 
        }
        supabase.table("audit_logs").insert(data).execute()
    except Exception as e:
        print(f"Failed to log transaction (Attempting Retry): {e}")
        raise e # Re-raise to trigger tenacity retry

@router.post("/intercept", response_model=InterceptResponse, dependencies=[Depends(RateLimiter(times=100, seconds=60))])
async def intercept_traffic(
    request: InterceptRequest, 
    background_tasks: BackgroundTasks,
    req: Request, 
    api_key: str = Depends(get_api_key)
):
    start_time = datetime.now()
    try:
        request_id = getattr(req.state, "request_id", "unknown")
        
        # Extract conversation_id
        conversation_id = request.metadata.get("conversation_id") if request.metadata else None
        
        # Step 0: Policy Lookup
        policy_prompt = None
        
        # Priority 1: Config Payload
        if request.policy_config and request.policy_config.get("auditor_prompt"):
            policy_prompt = request.policy_config.get("auditor_prompt")
        
        # Priority 2: DB Lookup (if no prompt in config)
        elif request.policy_id:
            try:
                response = supabase.table("policies").select("rules_prompt").eq("id", request.policy_id).execute()
                if response.data:
                    policy_prompt = response.data[0]["rules_prompt"]
            except Exception as ex:
                print(f"Policy Fetch Error: {ex}") 

        # Step 1: Redaction (The Shield)
        # Enable Synthetic Swapping for "Advanced Security" demo
        redacted_data, hits = redactor.redact_json(request.payload, mode="swap", config=request.policy_config)
        
        # Simple check: If data changed, PII was found.
        has_pii = len(hits) > 0 # Use hits list for accuracy
        
        if has_pii:
            # PII DETECTED -> PAUSE FLOW
            pending_id = str(uuid.uuid4())
            redis_url = os.environ.get("UPSTASH_REDIS_URL", "redis://localhost:6379")
            
            if conversation_id:
                model = request.payload.get("model", "Gemini 3 Flash")
                prompt = (request.payload.get("input") or request.payload.get("message") or "Unknown")
                # Create conversation and log user message with 'warning' status
                background_tasks.add_task(
                    add_chat_message, 
                    conversation_id, 
                    "user", 
                    prompt, 
                    "warning",
                    title=prompt[:50],
                    model=model
                )

            cache_data = {
                "original": request.payload,
                "redacted": redacted_data,
                "hits": hits, # Store hits
                "policy_prompt": policy_prompt,
                "request_id": request_id, 
                "source": request.source,
                "metadata": request.metadata # Store metadata (conversation_id)
            }
            
            try:
                r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
                await r.setex(f"pending:{pending_id}", 300, json.dumps(cache_data))
                await r.close()
            except Exception as e:
                print(f"Redis Cache Error: {e}")
                raise HTTPException(status_code=500, detail="Security State Cache Failed")

            return InterceptResponse(
                status="REQUIRES_CONFIRMATION",
                processed_at=datetime.now(timezone.utc),
                pending_id=pending_id,
                violation_details=f"Detected: {', '.join(list(set([h['type'] for h in hits])))}", # Unique types
                redacted_payload=redacted_data 
            )

        # Step 2: Auditing (The Sense)
        audit_result = auditor.audit_payload(redacted_data, policy_prompt=policy_prompt) if policy_prompt else auditor.audit_payload(redacted_data)

        # Step 3: LLM Generation (The Brain) - If Safe
        ai_response_text = None
        
        if not has_pii:
            # Extract prompt from payload
            prompt = request.payload.get("input") or request.payload.get("message") or request.payload.get("prompt") or json.dumps(request.payload)
            
            # Log User Message
            if conversation_id:
                model = request.payload.get("model", "Gemini 3 Flash")
                background_tasks.add_task(
                    add_chat_message, 
                    conversation_id, 
                    "user", 
                    prompt, 
                    "verified",
                    title=prompt[:50],
                    model=model
                )

            # Call Gemini/LLM
            context_str = await build_conversation_context(conversation_id)
            
            final_prompt = context_str + str(prompt)
            
            llm_result = await llm_router.route_request(
                provider="gemini", # Default to Gemini for now
                prompt=final_prompt,
                system_instruction="You are a helpful AI assistant. Please respond to the user's request."
            )
            ai_response_text = llm_result.get("text")
            
            # Log AI Response
            if conversation_id and ai_response_text:
                background_tasks.add_task(add_chat_message, conversation_id, "assistant", ai_response_text, "verified")

        # Step 4: Logging
        log_metadata = {
            "source": request.source,
            "request_id": request_id,
            "token_count": len(str(request.payload)) // 4,
            "bypass_used": False
        }
        if request.metadata:
            log_metadata.update(request.metadata)

        background_tasks.add_task(log_transaction, request.payload, redacted_data, audit_result, request_id, has_pii, None, False, log_metadata)

        latency = (datetime.now() - start_time).total_seconds() * 1000

        return InterceptResponse(
            status="processed",
            processed_at=datetime.now(timezone.utc),
            redacted_payload=redacted_data,
            verdict=audit_result.verdict,
            compliance_score=audit_result.compliance_score,
            reasoning=audit_result.reasoning,
            ai_response=ai_response_text, # Return the AI response
            receipt=PrivacyReceipt(
                latency_ms=round(latency, 2),
                engine="Bento SENSE (Llama 3)" + (" + Gemini" if ai_response_text else ""),
                scrubbed_count=len(hits),
                policy_id=request.policy_id or "personal-default-v1"
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ConfirmRequest(BaseModel):
    pending_id: str
    choice: str = Field(..., description="SAFE | ORIGINAL")

@router.post("/intercept/confirm")
async def confirm_intercept(request: ConfirmRequest, background_tasks: BackgroundTasks):
    try:
        redis_url = os.environ.get("UPSTASH_REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        
        cache_data_str = await r.get(f"pending:{request.pending_id}")
        if not cache_data_str:
            raise HTTPException(status_code=404, detail="Session expired or invalid ID")
            
        cache_data = json.loads(cache_data_str)
        
        # Decide payload
        final_payload = cache_data["redacted"] if request.choice == "SAFE" else cache_data["original"]
        has_pii = request.choice == "ORIGINAL"
        
        # Audit again if SAFE (just to be sure/get score) or just use cache
        verdict = "VALID" if request.choice == "SAFE" else "FLAGGED"
        audit_result = type('obj', (object,), {
            "verdict": verdict,
            "compliance_score": 1.0 if request.choice == "SAFE" else 0.5,
            "reasoning": "User override applied."
        })
        
        # Step 3: LLM Generation (The Brain) - Executed NOW
        ai_response_text = None
        
        # Extract prompt
        prompt = final_payload.get("input") or final_payload.get("message") or final_payload.get("prompt") or json.dumps(final_payload)
        
        # Build Context using the metadata preserved in cache
        metadata = cache_data.get("metadata") or {}
        conversation_id = metadata.get("conversation_id")
        context_str = await build_conversation_context(conversation_id)
        
        final_prompt = context_str + str(prompt)
        
        llm_result = await llm_router.route_request(
            provider="gemini", 
            prompt=final_prompt,
            system_instruction="You are a helpful AI assistant. Please respond to the user's request."
        )
        ai_response_text = llm_result.get("text")
        
        # Log it
        payload_raw = cache_data["original"]
        payload_redacted = final_payload
        
        log_metadata = {
            "source": cache_data.get("source", "api-gateway"),
            "request_id": cache_data.get("request_id", "unknown"),
             "bypass_used": request.choice == "ORIGINAL"
        }
        if metadata:
            log_metadata.update(metadata)

        if conversation_id:
            # Update user message status to reflect the choice
            await update_last_message_status(
                conversation_id, 
                "warning", 
                "verified" if request.choice == "SAFE" else "insecure"
            )

        if conversation_id and ai_response_text:
            background_tasks.add_task(
                add_chat_message, 
                conversation_id, 
                "assistant", 
                ai_response_text, 
                "verified" if request.choice == "SAFE" else "insecure"
            )

        background_tasks.add_task(
            log_transaction, 
            payload_raw, 
            payload_redacted, 
            audit_result, 
            cache_data.get("request_id"), 
            has_pii,
            None,
            request.choice == "ORIGINAL",
            log_metadata
        )
        
        # Cleanup
        await r.delete(f"pending:{request.pending_id}")
        await r.close()
        
        return {
            "status": "processed",
            "verdict": verdict,
            "ai_response": ai_response_text,
            "receipt": {
                "latency_ms": 100,
                "engine": "Bento SENSE (Override)",
                "scrubbed_count": 0 if request.choice == "ORIGINAL" else len(cache_data.get("hits", [])),
                "policy_id": "manual-override"
            }
        }

    except Exception as e:
        print(f"Confirm Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
