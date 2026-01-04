"""
Profile Management Endpoints
Handles user privacy profile CRUD operations.
"""
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import logging
from fastapi_limiter.depends import RateLimiter

from app.db.supabase import supabase, get_authenticated_client
from app.core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# =====================================================
# Pydantic Models
# =====================================================

class ProfileToggle(BaseModel):
    """The 7 core privacy toggles"""
    email: bool = True
    phone: bool = True
    names: bool = True
    payment: bool = True
    location: bool = True
    credentials: bool = True

class ProfileCreate(BaseModel):
    """Request model for creating a new profile"""
    name: str = Field(..., min_length=1, max_length=100)
    icon_name: str = "User"
    color: str = "text-zinc-400"
    description: str = "Custom user profile"
    toggles: ProfileToggle = ProfileToggle()
    custom_keywords: List[str] = []

class ProfileUpdate(BaseModel):
    """Request model for updating a profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon_name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    toggles: Optional[ProfileToggle] = None
    custom_keywords: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ProfileResponse(BaseModel):
    """Response model for profile data"""
    id: str
    user_id: str
    name: str
    icon_name: str
    color: str
    description: str
    is_active: bool
    redact_email: bool
    redact_phone: bool
    redact_names: bool
    redact_payment: bool
    redact_location: bool
    redact_credentials: bool
    custom_keywords: List[str]
    created_at: datetime
    updated_at: datetime

class ProfileStatusResponse(BaseModel):
    """Response for profile status check"""
    setup_required: bool
    profiles: List[ProfileResponse]
    active_profile_id: Optional[str] = None

# =====================================================
# Helper Functions
# =====================================================

async def get_user_id_from_request(request: Request) -> tuple[str, str]:
    """
    Extract user_id and JWT token from validated Supabase JWT token.
    Uses the existing JWT validation from security.py
    
    Returns:
        tuple: (user_id, jwt_token)
    """
    try:
        # Get the token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        
        jwt_token = auth_header.split(" ")[1]
        
        # Validate the token and get payload
        user_payload = await get_current_user(request)
        user_id = user_payload.get("sub")  # 'sub' contains the user ID in Supabase JWTs
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        
        return user_id, jwt_token
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract user ID from token: {e}")
        raise HTTPException(status_code=401, detail="Authentication required")

# =====================================================
# Endpoints
# =====================================================

@router.get("/status", response_model=ProfileStatusResponse)
async def get_profile_status(request: Request):
    """
    Check if user has profiles and return their status.
    Returns setup_required=true if no profiles exist.
    Requires: Authorization: Bearer <JWT_TOKEN>
    """
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        
        # Use authenticated client for RLS
        auth_supabase = get_authenticated_client(jwt_token)
        
        # Fetch all profiles for this user
        response = auth_supabase.table("user_profiles")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=False)\
            .execute()
        
        profiles = response.data or []
        
        # Find active profile
        active_profile_id = None
        for profile in profiles:
            if profile.get("is_active"):
                active_profile_id = profile["id"]
                break
        
        return ProfileStatusResponse(
            setup_required=len(profiles) == 0,
            profiles=[ProfileResponse(**p) for p in profiles],
            active_profile_id=active_profile_id
        )
    
    except Exception as e:
        logger.error(f"Error fetching profile status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ProfileResponse, status_code=201)
async def create_profile(
    profile: ProfileCreate,
    request: Request
):
    """
    Create a new privacy profile for the user.
    Automatically sets as active if it's the first profile.
    Requires: Authorization: Bearer <JWT_TOKEN>
    """
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        
        # Use authenticated client for RLS
        auth_supabase = get_authenticated_client(jwt_token)
        
        # Check if user has any existing profiles
        existing = auth_supabase.table("user_profiles")\
            .select("id")\
            .eq("user_id", user_id)\
            .execute()
        
        is_first_profile = len(existing.data or []) == 0
        
        # Prepare profile data
        profile_data = {
            "user_id": user_id,
            "name": profile.name,
            "icon_name": profile.icon_name,
            "color": profile.color,
            "description": profile.description,
            "is_active": is_first_profile,  # Auto-activate first profile
            "redact_email": profile.toggles.email,
            "redact_phone": profile.toggles.phone,
            "redact_names": profile.toggles.names,
            "redact_payment": profile.toggles.payment,
            "redact_location": profile.toggles.location,
            "redact_credentials": profile.toggles.credentials,
            "custom_keywords": profile.custom_keywords
        }
        
        # Insert profile with authenticated client
        response = auth_supabase.table("user_profiles")\
            .insert(profile_data)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create profile")
        
        created_profile = response.data[0]
        logger.info(f"Created profile '{profile.name}' for user {user_id}")
        
        return ProfileResponse(**created_profile)
    
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[ProfileResponse])
async def list_profiles(request: Request):
    """Get all profiles for the authenticated user. Requires JWT."""
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        auth_supabase = get_authenticated_client(jwt_token)
        
        response = auth_supabase.table("user_profiles")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=False)\
            .execute()
        
        profiles = response.data or []
        return [ProfileResponse(**p) for p in profiles]
    
    except Exception as e:
        logger.error(f"Error listing profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: str,
    request: Request
):
    """Get a specific profile by ID. Requires JWT."""
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        auth_supabase = get_authenticated_client(jwt_token)
        
        response = auth_supabase.table("user_profiles")\
            .select("*")\
            .eq("id", profile_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return ProfileResponse(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: str,
    updates: ProfileUpdate,
    request: Request
):
    """Update a profile's settings. Requires JWT."""
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        auth_supabase = get_authenticated_client(jwt_token)
        
        # Build update dict (only include provided fields)
        update_data = {}
        if updates.name is not None:
            update_data["name"] = updates.name
        if updates.icon_name is not None:
            update_data["icon_name"] = updates.icon_name
        if updates.color is not None:
            update_data["color"] = updates.color
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.is_active is not None:
            update_data["is_active"] = updates.is_active
        if updates.custom_keywords is not None:
            update_data["custom_keywords"] = updates.custom_keywords
        
        # Handle toggles
        if updates.toggles:
            update_data.update({
                "redact_email": updates.toggles.email,
                "redact_phone": updates.toggles.phone,
                "redact_names": updates.toggles.names,
                "redact_payment": updates.toggles.payment,
                "redact_location": updates.toggles.location,
                "redact_credentials": updates.toggles.credentials,
            })
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        # Update profile with authenticated client
        response = auth_supabase.table("user_profiles")\
            .update(update_data)\
            .eq("id", profile_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        logger.info(f"Updated profile {profile_id} for user {user_id}")
        return ProfileResponse(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{profile_id}", status_code=204)
async def delete_profile(
    profile_id: str,
    request: Request
):
    """Delete a profile. Requires JWT."""
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        auth_supabase = get_authenticated_client(jwt_token)
        
        # Check if this is the active profile
        profile = auth_supabase.table("user_profiles")\
            .select("is_active")\
            .eq("id", profile_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        was_active = profile.data[0].get("is_active", False)
        
        # Delete profile
        auth_supabase.table("user_profiles")\
            .delete()\
            .eq("id", profile_id)\
            .eq("user_id", user_id)\
            .execute()
        
        # If deleted profile was active, activate another one
        if was_active:
            remaining = auth_supabase.table("user_profiles")\
                .select("id")\
                .eq("user_id", user_id)\
                .limit(1)\
                .execute()
            
            if remaining.data:
                auth_supabase.table("user_profiles")\
                    .update({"is_active": True})\
                    .eq("id", remaining.data[0]["id"])\
                    .execute()
        
        logger.info(f"Deleted profile {profile_id} for user {user_id}")
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{profile_id}/activate", response_model=ProfileResponse)
async def activate_profile(
    profile_id: str,
    request: Request
):
    """Set a profile as the active one (deactivates others). Requires JWT."""
    try:
        user_id, jwt_token = await get_user_id_from_request(request)
        auth_supabase = get_authenticated_client(jwt_token)
        
        # Update will trigger the database trigger to deactivate others
        response = auth_supabase.table("user_profiles")\
            .update({"is_active": True})\
            .eq("id", profile_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        logger.info(f"Activated profile {profile_id} for user {user_id}")
        return ProfileResponse(**response.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
