from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase import supabase
from app.core.security import get_api_key
from pydantic import BaseModel
from datetime import datetime
import os
import redis.asyncio as redis

from app.utils.history_manager import update_last_message_status

router = APIRouter()

class CancelRequest(BaseModel):
    pending_id: str
    conversation_id: str = None  # Added to track session continuity!

@router.post("/cancel", dependencies=[Depends(get_api_key)])
async def cancel_request(req: CancelRequest):
    """
    Log a 'CANCELED' event for analytics tracking when a user aborts an intervention.
    """
    try:
        # 1. Update optimized Chat History (new tables)
        if req.conversation_id:
            await update_last_message_status(req.conversation_id, "warning", "canceled")

        # 2. Cleanup Redis (Zero Retention)
        redis_url = os.environ.get("UPSTASH_REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        await r.delete(f"pending:{req.pending_id}")
        await r.close()

        # 3. Log Legacy Audit Entry
        # We assume the pending_id correlates to a cached intention.
        # We'll log a simplified entry.
        data = {
            "payload_raw": {"event": "user_aborted"},
            "verdict": "CANCELED",
            "compliance_score": 0.0,
            "ai_reasoning": "User manually canceled the request during intervention.",
            "has_pii": True, # Usually canceled b/c of PII warning
            "metadata": {
                "related_pending_id": req.pending_id,
                "conversation_id": req.conversation_id, # Ensure we link this to the thread!
                "source": "web-dashboard"
            }
        }
        supabase.table("audit_logs").insert(data).execute()
        return {"status": "success", "message": "Cancellation logged and conversation preserved"}

    except Exception as e:
        print(f"Cancel Log Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
