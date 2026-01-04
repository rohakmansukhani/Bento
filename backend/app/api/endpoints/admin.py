from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_api_key
import random

router = APIRouter()

@router.get("/admin/stats", dependencies=[Depends(get_api_key)])
async def get_admin_stats():
    """
    Mock Aggregated Stats for Global Admin View.
    in a real scenario, this would aggregate data from ALL tenants.
    """
    return {
        "total_tenants": 12,
        "active_tenants": 8,
        "global_requests_24h": 14520,
        "global_blocked_24h": 342,
        "system_health": "99.99%",
        "tenants": [
            {"name": "Acme Corp", "status": "Active", "requests": 8500, "risk_score": 12},
            {"name": "Wayne Enterprises", "status": "Active", "requests": 4200, "risk_score": 5},
            {"name": "Cyberdyne", "status": "Warning", "requests": 1200, "risk_score": 65},
            {"name": "Massive Dynamic", "status": "Active", "requests": 620, "risk_score": 8},
        ]
    }
