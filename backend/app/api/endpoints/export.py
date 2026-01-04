from fastapi import APIRouter, Depends, HTTPException, Response
from app.db.supabase import supabase
from app.core.security import get_api_key
import csv
import io
from datetime import datetime

router = APIRouter()

@router.get("/export/audit-csv", dependencies=[Depends(get_api_key)])
async def export_audit_csv():
    """
    Stream full audit logs as CSV.
    """
    try:
        # Fetch all logs (limit 1000 for now to prevent timeout)
        response = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(1000).execute()
        logs = response.data

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(["Log ID", "Timestamp", "Source", "Verdict", "PII Detected", "Has Violation", "Token Count", "Est. Cost (INR)"])

        for log in logs:
            meta = log.get("metadata") or {}
            
            # Extract fields
            log_id = log.get("id")
            timestamp = log.get("created_at")
            source = meta.get("source", "API")
            verdict = log.get("verdict", "UNKNOWN")
            has_pii = "YES" if log.get("has_pii") else "NO"
            violation = "YES" if verdict != "VALID" else "NO"
            
            token_count = meta.get("token_count", 0)
            # Cost approx ₹830 per 1M tokens -> (tokens / 1M) * 830
            cost = (token_count / 1_000_000) * 830
            cost_str = f"₹{cost:.4f}"

            writer.writerow([log_id, timestamp, source, verdict, has_pii, violation, token_count, cost_str])

        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bento_audit_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )

    except Exception as e:
        print(f"Export Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export CSV")
