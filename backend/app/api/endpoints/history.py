from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase import supabase
from app.core.security import get_api_key
from typing import List, Any
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

@router.get("/history/{id}", dependencies=[Depends(get_api_key)])
async def get_history_detail(id: str):
    """Fetch full chat history for a specific conversation."""
    try:
        # 1. Fetch from optimized chat_messages table
        response = supabase.table("chat_messages") \
            .select("*") \
            .eq("conversation_id", id) \
            .order("created_at", desc=False) \
            .execute()
        
        messages_data = response.data
        
        # 2. Fallback: If no messages in new table, try legacy audit_logs
        if not messages_data:
            # Check if this ID exists in audit_log metadata
            response = supabase.table("audit_logs") \
                .select("*") \
                .eq("metadata->>conversation_id", id) \
                .order("created_at", desc=False) \
                .execute()
            logs = response.data
            
            if not logs:
                # Direct ID check (very old logs)
                response = supabase.table("audit_logs").select("*").eq("id", id).execute()
                logs = response.data
                
            if not logs:
                raise HTTPException(status_code=404, detail="Conversation not found")
            
            # Reconstruct from legacy logs
            messages = []
            for log in logs:
                payload = log.get("payload_raw", {}) or {}
                input_text = payload.get("input") or payload.get("prompt") or payload.get("message") or "Unknown"
                
                messages.append({
                    "role": "user",
                    "content": input_text,
                    "timestamp": log.get("created_at"),
                    "status": "warning" if log.get("verdict") == "FLAGGED" else "verified"
                })
                
                if log.get("ai_reasoning"):
                    messages.append({
                        "role": "ai",
                        "content": log.get("ai_reasoning"),
                        "timestamp": log.get("created_at"),
                        "status": "verified"
                    })
            
            return {"id": id, "messages": messages}

        # 3. New Table Success path
        messages = []
        for m in messages_data:
            messages.append({
                "role": "user" if m["role"] == "user" else "ai",
                "content": m["content"],
                "timestamp": m["created_at"],
                "status": m.get("status", "verified")
            })

        return {
            "id": id,
            "messages": messages
        }

    except Exception as e:
        print(f"History Detail Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", dependencies=[Depends(get_api_key)])
async def get_history(limit: int = 50):
    """Fetch list of conversations from optimized tables."""
    try:
        # Query conversations table directly
        response = supabase.table("conversations") \
            .select("*, chat_messages(content, status, created_at, role)") \
            .order("updated_at", desc=True) \
            .limit(limit) \
            .execute()
            
        convs = response.data
        history_items = []
        
        for c in convs:
            # Find the first user message for title
            messages = c.get("chat_messages", [])
            # Sort local messages by timestamp since Supabase might return them unordered in joins
            messages.sort(key=lambda x: x.get("created_at", ""))
            
            user_messages = [m for m in messages if m.get("role") == "user"]
            first_msg = user_messages[0]["content"] if user_messages else "New Conversation"
            preview_msg = user_messages[0]["content"] if user_messages else ""
            
            latest_status = "Completed"
            if messages:
                last_m = messages[-1]
                if last_m.get("status") == "warning": latest_status = "Flagged"
                if last_m.get("status") == "canceled": latest_status = "Canceled"
                if last_m.get("status") == "insecure": latest_status = "Insecure"

            history_items.append({
                "id": c["id"],
                "title": first_msg[:40] + "..." if len(first_msg) > 40 else first_msg,
                "preview": preview_msg[:100] + "..." if len(preview_msg) > 100 else preview_msg,
                "date": c["updated_at"] or c["created_at"],
                "model": c.get("model") or "Gemini 3 Flash",
                "status": latest_status,
                "verdict_color": "text-red-400" if latest_status in ["Flagged", "Canceled", "Insecure"] else "text-emerald-400"
            })
            
        return history_items

    except Exception as e:
        print(f"History List Error: {e}")
        # If new table doesn't exist yet, user might see error. 
        # But they said they would run the SQL.
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{id}", dependencies=[Depends(get_api_key)])
async def delete_conversation(id: str):
    """Delete a conversation and all its messages."""
    try:
        # 1. Delete from conversations table (cascades to chat_messages)
        res = supabase.table("conversations").delete().eq("id", id).execute()
        
        # 2. Cleanup Legacy Audit Logs
        supabase.table("audit_logs").delete().eq("metadata->>conversation_id", id).execute()
            
        return {"status": "success", "message": "Conversation deleted"}

    except Exception as e:
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")
