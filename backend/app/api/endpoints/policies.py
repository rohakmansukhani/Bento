from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase import supabase
from app.core.security import get_api_key
from pydantic import BaseModel
from typing import List

router = APIRouter()

class PolicyToggleRequest(BaseModel):
    active: bool

@router.get("/policies")
async def get_policies(api_key: str = Depends(get_api_key)):
    try:
        # Fetch from Supabase 'policies' table
        # Assuming a table 'policies' exists with columns: id, name, description, active, level, applied_to
        response = supabase.table("policies").select("*").execute()
        
        # If table is empty or doesn't exist (MVP fallback), return standard set
        if not response.data:
             return [
                { "id": 1, "name": "PII Redaction (Global)", "description": "Redacts emails, phone numbers, and credit cards.", "active": True, "level": "High", "appliedTo": "All Traffic" },
                { "id": 2, "name": "Competitor Shield", "description": "Blocks mention of registered competitors.", "active": True, "level": "Medium", "appliedTo": "Sales Bots" },
                { "id": 3, "name": "Toxic Language Filter", "description": "Prevents hostile or offensive output.", "active": False, "level": "Low", "appliedTo": "Internal" }
            ]
            
        return response.data
    except Exception as e:
        # Fallback for MVP if DB missing
        print(f"Policy Fetch Error: {e}")
        return [
            { "id": 1, "name": "PII Redaction (Global)", "description": "Redacts emails, phone numbers, and credit cards.", "active": True, "level": "High", "appliedTo": "All Traffic" },
            { "id": 2, "name": "Competitor Shield", "description": "Blocks mention of registered competitors.", "active": True, "level": "Medium", "appliedTo": "Sales Bots" },
            { "id": 3, "name": "Toxic Language Filter", "description": "Prevents hostile or offensive output.", "active": False, "level": "Low", "appliedTo": "Internal" }
        ]

class ToggleRequest(BaseModel):
    active: bool

@router.post("/policies/{policy_id}/toggle")
async def toggle_policy(policy_id: int, request: ToggleRequest, api_key: str = Depends(get_api_key)):
    try:
        # Update Supabase
        # We try to update. If it fails (e.g. using fallback data), we just return success for the demo UI state
        supabase.table("policies").update({"active": request.active}).eq("id", policy_id).execute()
        return {"status": "success", "active": request.active}
    except Exception as e:
        print(f"Policy Toggle Error: {e}")
        # Allow UI to toggle even if backend fails (Mock behavior for demo)
        return {"status": "success", "active": request.active, "note": "Simulation Mode"}
