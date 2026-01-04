
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
import json
import os
import redis.asyncio as redis
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.auditor import auditor
from app.core.llm_router import llm_router
from app.api.endpoints.intercept import InterceptResponse, log_transaction, PrivacyReceipt
from app.core.security import get_api_key
from app.utils.context_builder import build_conversation_context

router = APIRouter()

class ConfirmRequest(BaseModel):
    pending_id: str = Field(..., description="The UUID returned by the paused intercept request.")
    choice: str = Field(..., description="User decision: 'SAFE' (use redacted), 'ORIGINAL' (bypass shield), or 'CANCEL'.")
    llm_provider: Optional[str] = Field("gemini", description="The LLM to route to. Options: 'gemini', 'claude', 'gpt'.")

@router.post("/intercept/confirm", response_model=InterceptResponse)
async def confirm_traffic(
    request: ConfirmRequest, 
    background_tasks: BackgroundTasks,
    api_key: str = Depends(get_api_key)
):
    start_time = datetime.now()
    
    # ... (Existing Logic)
    
    redis_url = os.environ.get("UPSTASH_REDIS_URL", "redis://localhost:6379")
    r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    
    # 1. Fetch State & IMMEDIATELY DELETE (Zero-Retention)
    cached_data_json = await r.get(f"pending:{request.pending_id}")
    if not cached_data_json:
        await r.close()
        raise HTTPException(status_code=404, detail="Pending Request Not Found or Expired")
    
    # ZERO-RETENTION: Delete immediately after retrieval to minimize data-at-rest window
    await r.delete(f"pending:{request.pending_id}")
    await r.close()
    
    cached_data = json.loads(cached_data_json)

    if request.choice == "CANCEL":
        return InterceptResponse(
            status="cancelled",
            processed_at=datetime.now(timezone.utc),
            redacted_payload={},
            verdict="CANCELLED",
            compliance_score=0.0,
            reasoning="User cancelled the request."
        )

    # 2. Select Payload & Track Bypass
    bypass_used = request.choice == "ORIGINAL"
    target_payload = cached_data["redacted"] if request.choice == "SAFE" else cached_data["original"]
    
    # ... (LLM Logic)
    
    # 3. Route to LLM (The Brain)
    actual_data = target_payload.get("payload", target_payload)
    prompt = None
    for key in ["user_query", "prompt", "text", "input", "message", "content"]:
        if isinstance(actual_data, dict) and key in actual_data:
            prompt = str(actual_data[key])
            break
    if not prompt:
        prompt = f"Process the following structured data:\n{json.dumps(actual_data, indent=2)}"
    
    ai_response_data = await llm_router.route_request(
        provider=request.llm_provider,
        prompt=await build_conversation_context(cached_data.get("metadata", {}).get("conversation_id")) + prompt,
        system_instruction="You are a helpful AI assistant. Please respond to the user's request."
    )
    
    ai_response_text = ai_response_data.get("text", "")
    token_usage = ai_response_data.get("usage", 0)

    # 5. Final Audit
    audit_result = auditor.audit_payload(target_payload, policy_prompt=cached_data.get("policy_prompt"))
    
    # Log it with bypass flag
    background_tasks.add_task(
        log_transaction, 
        cached_data["original"], 
        target_payload, 
        audit_result, 
        cached_data["request_id"],
        True, # was blocked so had pii
        token_usage, # Pass real token count
        bypass_used # NEW: Track if user bypassed shield
    )

    latency = (datetime.now() - start_time).total_seconds() * 1000
    hits = cached_data.get("hits", [])

    return InterceptResponse(
        status="processed",
        processed_at=datetime.now(timezone.utc),
        redacted_payload=target_payload,
        verdict=audit_result.verdict,
        compliance_score=audit_result.compliance_score,
        reasoning=f"User Choice: {request.choice}. Security Event logged.",
        ai_response=ai_response_text, # Return REAL AI response (Raw)
        receipt=PrivacyReceipt(
            latency_ms=round(latency, 2),
            engine=request.llm_provider,
            scrubbed_count=len(hits) if request.choice == "SAFE" else 0, # Only count ingress hits if safe
            policy_id="personal-default-v1"
        )
    )
