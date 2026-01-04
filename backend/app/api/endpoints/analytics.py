from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase import supabase
from app.core.security import get_api_key
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/analytics")
async def get_analytics(range: str = "24h", api_key: str = Depends(get_api_key)):
    """
    Fetch real-time analytics from audit_logs.
    """
    try:
        # Calculate time window
        now = datetime.now(timezone.utc)
        delta = timedelta(hours=24) # default
        
        if range == "1h":
            delta = timedelta(hours=1)
        elif range == "7d":
            delta = timedelta(days=7)
        elif range == "30d":
            delta = timedelta(days=30)
            
        start_time = now - delta
        start_time_iso = start_time.isoformat()

        # 1. Total Inspections (filtered by time)
        total_res = supabase.table("audit_logs").select("id", count="exact").gte("created_at", start_time_iso).execute()
        total_inspections = total_res.count if total_res.count is not None else 0

        # 2. PII Detected
        pii_res = supabase.table("audit_logs").select("id", count="exact").eq("has_pii", True).gte("created_at", start_time_iso).execute()
        pii_detected = pii_res.count if pii_res.count is not None else 0

        # 3. Policy Violations
        voilations_res = supabase.table("audit_logs").select("id", count="exact").neq("verdict", "VALID").gte("created_at", start_time_iso).execute()
        total_violations = voilations_res.count if voilations_res.count is not None else 0

        # 4. Mock Cost Saved
        cost_saved = (total_inspections * 0.05) + (pii_detected * 5.0)

        # 5. Recent Alerts
        recent_res = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(5).execute()
        recent_alerts = recent_res.data
        
        # 6. Traffic Volume
        # Fetch logs within the window (limit increased for larger windows)
        limit = 500 if range in ["7d", "30d"] else 200
        history_res = supabase.table("audit_logs").select("created_at, verdict, metadata").gte("created_at", start_time_iso).order("created_at", desc=True).limit(limit).execute()
        
        # Aggregate by hour intervals
        traffic_map = {}
        now = datetime.now(timezone.utc)
        
        # Initialize last 5 buckets (4-hour intervals roughly for the UI)
        # Or just use the last few distinct hours found
        
        for log in history_res.data:
            try:
                # Parse ISO string
                dt = datetime.fromisoformat(log['created_at'].replace('Z', '+00:00'))
                
                # Dynamic Grouping
                if range == "1h":
                    key = dt.strftime("%H:%M") # Group by minute for 1H view
                elif range in ["7d", "30d"]:
                    key = dt.strftime("%Y-%m-%d") # Group by day for long views
                else:
                    key = dt.strftime("%H:00") # Group by hour for 24H
                
                if key not in traffic_map:
                    traffic_map[key] = {"requests": 0, "blocked": 0}
                
                traffic_map[key]["requests"] += 1
                if log["verdict"] != "VALID":
                    traffic_map[key]["blocked"] += 1
            except Exception:
                continue

        # Convert to list and sort (roughly) taking last 7 entries
        # For a proper chart, we'd iterate over the last 24h timestamps, but this is a good dynamic approximation
        chart_data = []
        for time_key in sorted(traffic_map.keys()):
            chart_data.append({
                "name": time_key,
                "requests": traffic_map[time_key]["requests"],
                "blocked": traffic_map[time_key]["blocked"]
            })
        
        # If empty (no data), provide empty structure
        if not chart_data:
            chart_data = [{"name": "No Data", "requests": 0, "blocked": 0}]

        # 7. Safety Score Calculation with Bypass Penalty
        # Base 100. Deduct for violations and heavily penalize bypasses.
        # Bypass penalty: -10% per bypass
        bypass_count = 0
        for log in history_res.data:
            meta = log.get("metadata", {}) or {}
            if meta.get("bypass_used", False):
                bypass_count += 1
        
        if total_inspections > 0:
            base_score = ((total_inspections - total_violations) / total_inspections) * 100
            bypass_penalty = bypass_count * 10  # -10% per bypass
            safety_score = max(0, int(base_score - bypass_penalty))
        else:
            safety_score = 100

        # 8. Token Usage Calculation (from metadata->>'token_count')
        # Use REAL token counts saved from confirm.py
        total_tokens = 0
        for log in history_res.data:
            meta = log.get("metadata", {}) or {}
            # Use real token count from LLM response, not approximation
            total_tokens += meta.get("token_count", 0)

        # Cost Estimate: $5.00 / 1M input tokens + $15.00 / 1M output tokens (avg $10/1M)
        # Using ₹830 per 1M tokens approx
        est_cost_inr = (total_tokens / 1_000_000) * 830

        return {
            "safety_score": safety_score,
            "stats": [
                {
                    "title": "Total Inspections",
                    "value": f"{total_inspections:,}",
                    "change": "--", 
                    "trend": "neutral",
                    "color": "text-sky-400"
                },
                {
                    "title": "Tokens Processed",
                    "value": f"{total_tokens:,}",
                    "change": "--",
                    "trend": "up",
                    "color": "text-amber-400"
                },
                {
                    "title": "Est. Cost (INR)",
                    "value": f"₹{est_cost_inr:,.2f}",
                    "change": "--",
                    "trend": "neutral",
                    "color": "text-emerald-400"
                },
                {
                    "title": "PII Detected",
                    "value": f"{pii_detected:,}",
                    "change": "--", 
                    "trend": "neutral",
                    "color": "text-violet-400"
                }
            ],
            "recent_alerts": [
                {
                    "id": log["id"],
                    "type": "Data Scan", 
                    "source": log["metadata"].get("source", "API") if log.get("metadata") else "API",
                    "time": log["created_at"],
                    "status": log["verdict"]
                } for log in recent_alerts
            ],
            "traffic_chart": chart_data[-7:] # Return last 7 points
        }

    except Exception as e:
        print(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
