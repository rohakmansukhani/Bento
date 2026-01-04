from app.db.supabase import supabase
from datetime import datetime
from typing import Optional

async def ensure_conversation(conversation_id: str, title: Optional[str] = None, model: Optional[str] = None):
    """Ensure a conversation exists in the database."""
    if not conversation_id:
        return
        
    try:
        # Check if exists
        res = supabase.table("conversations").select("id").eq("id", conversation_id).execute()
        if not res.data:
            # Create it
            supabase.table("conversations").insert({
                "id": conversation_id,
                "title": title or "New Conversation",
                "model": model or "Gemini 3 Flash",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()
        else:
            # Update updated_at
            supabase.table("conversations").update({
                "updated_at": datetime.now().isoformat()
            }).eq("id", conversation_id).execute()
    except Exception as e:
        print(f"Error ensuring conversation: {e}")

async def add_chat_message(
    conversation_id: str, 
    role: str, 
    content: str, 
    status: str = "verified",
    latency_ms: float = 0,
    scrubbed_count: int = 0,
    title: Optional[str] = None,
    model: Optional[str] = None
):
    """Add a message to a conversation."""
    if not conversation_id:
        return
        
    try:
        await ensure_conversation(conversation_id, title=title, model=model)
        
        data = {
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "status": status,
            "latency_ms": latency_ms,
            "scrubbed_count": scrubbed_count,
            "created_at": datetime.now().isoformat()
        }
        res = supabase.table("chat_messages").insert(data).execute()
        if res.data:
            return res.data[0].get("id")
    except Exception as e:
        print(f"Error adding chat message: {e}")
    return None

async def update_last_message_status(conversation_id: str, old_status: str, new_status: str):
    """Update the status of the most recent message with a specific old status."""
    if not conversation_id:
        return
        
    try:
        # Find the last message with old_status
        res = supabase.table("chat_messages") \
            .select("id") \
            .eq("conversation_id", conversation_id) \
            .eq("status", old_status) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
            
        if res.data:
            msg_id = res.data[0].get("id")
            supabase.table("chat_messages").update({"status": new_status}).eq("id", msg_id).execute()
    except Exception as e:
        print(f"Error updating message status: {e}")
