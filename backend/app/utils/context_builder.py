from app.db.supabase import supabase
from typing import List, Dict, Any

async def build_conversation_context(conversation_id: str, limit: int = 10) -> str:
    """
    Fetches the last N valid turns of a conversation to build a context string.
    """
    if not conversation_id:
        return ""

    try:
        # Fetch successful logs for this conversation
        # We want message that were NOT blocked (or were confirmed)
        # However, for simplicity, we can fetch all and check verdict logic, 
        # or just fetch all and assume the UI/User logic handles the rest.
        # Better: Fetch all, sort by time asc.
        response = supabase.table("audit_logs")\
            .select("payload_raw, ai_reasoning, verdict, created_at")\
            .eq("metadata->>conversation_id", conversation_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
            
        logs = response.data or []
        # Reverse to get chronological order
        logs.reverse()

        context_parts = []
        for log in logs:
            payload = log.get("payload_raw", {})
            user_input = payload.get("input") or payload.get("prompt") or payload.get("message")
            
            # Use ai_response field if we started logging it, otherwise fallback to reasoning/dummy
            # Note: We haven't fully migrated to logging 'ai_response' column yet, 
            # so this might be empty for old logs.
            ai_output = log.get("ai_reasoning") # Temporary proxy
            
            if user_input and ai_output:
                context_parts.append(f"User: {user_input}")
                context_parts.append(f"AI: {ai_output}")
        
        if not context_parts:
            return ""

        return "Previous Conversation:\n" + "\n".join(context_parts) + "\n\n"

    except Exception as e:
        print(f"Context Build Error: {e}")
        return ""
