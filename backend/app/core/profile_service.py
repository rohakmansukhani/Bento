"""
Profile Service - Helper functions for fetching and managing user profiles
"""
import logging
from typing import Dict, Any, Optional
from app.db.supabase import supabase
from app.core.security import get_current_user
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

async def get_user_id_from_request(request: Request) -> str:
    """
    Extract user_id from Supabase JWT token.
    Uses the existing JWT validation from security.py
    """
    try:
        # This validates the JWT and returns the payload
        user_payload = await get_current_user(request)
        user_id = user_payload.get("sub")  # 'sub' contains the user ID in Supabase JWTs
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        
        return user_id
    except Exception as e:
        logger.error(f"Failed to extract user ID from token: {e}")
        raise HTTPException(status_code=401, detail="Authentication required")

async def fetch_active_profile_config(
    user_id: str,
    profile_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch the active profile for a user from Supabase.
    Returns policy_config dict compatible with existing redaction logic.
    
    Args:
        user_id: User ID to fetch profile for
        profile_id: Optional specific profile ID to use
        
    Returns:
        Dict containing policy configuration
    """
    try:
        # If specific profile_id provided, use that
        if profile_id:
            response = supabase.table("user_profiles")\
                .select("*")\
                .eq("id", profile_id)\
                .eq("user_id", user_id)\
                .execute()
        else:
            # Otherwise get active profile
            response = supabase.table("user_profiles")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("is_active", True)\
                .execute()
        
        if not response.data:
            # No profile found - return safe defaults
            logger.warning(f"No profile found for user {user_id}, using safe defaults")
            return get_default_policy_config()
        
        profile = response.data[0]
        
        # Build list of active protections for auditor prompt
        protections = []
        if profile["redact_email"]:
            protections.append("email addresses")
        if profile["redact_phone"]:
            protections.append("phone numbers")
        if profile["redact_names"]:
            protections.append("personal names")
        if profile["redact_payment"]:
            protections.append("payment information")
        if profile["redact_location"]:
            protections.append("location data")
        if profile["redact_credentials"]:
            protections.append("credentials and secrets")
        
        protections_str = ", ".join(protections) if protections else "all sensitive data"
        
        # Map profile to policy_config format
        policy_config = {
            "profile_id": profile["id"],
            "profile_name": profile["name"],
            "redact_email": profile["redact_email"],
            "redact_phone": profile["redact_phone"],
            "redact_person": profile["redact_names"],  # Map names -> person for compatibility
            "redact_org": False,  # Not in profile toggles, default to False
            "redact_payment": profile.get("redact_payment", True),
            "redact_location": profile.get("redact_location", True),
            "redact_credentials": profile.get("redact_credentials", True),
            "custom_keywords": profile.get("custom_keywords") or [],
            # Auto-generate auditor prompt based on profile
            "auditor_prompt": (
                f"You are a compliance officer for the '{profile['name']}' privacy context. "
                f"Your role is to protect: {protections_str}. "
                f"Analyze the payload and flag any violations. "
                f"If the content is safe, return a compliance score of 1.0."
            )
        }
        
        logger.info(f"Loaded profile '{profile['name']}' (ID: {profile['id']}) for user {user_id}")
        return policy_config
        
    except Exception as e:
        logger.error(f"Error fetching profile for user {user_id}: {e}")
        # Return safe defaults on error (fail-secure)
        return get_default_policy_config()

def get_default_policy_config() -> Dict[str, Any]:
    """
    Return safe default policy configuration.
    Used when no profile is found or on error (fail-secure).
    """
    return {
        "profile_name": "Safe Default",
        "redact_email": True,
        "redact_phone": True,
        "redact_person": True,
        "redact_org": True,
        "redact_payment": True,
        "redact_location": True,
        "redact_credentials": True,
        "custom_keywords": [],
        "auditor_prompt": (
            "You are a strict compliance officer. "
            "Flag any personally identifiable information (PII), "
            "financial data, credentials, or sensitive content. "
            "If valid, return score 1.0."
        )
    }

def build_policy_config_from_request(
    request_policy_config: Optional[Dict[str, Any]],
    profile_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Merge request-level policy_config with profile config.
    Request config takes precedence (for backwards compatibility).
    
    Args:
        request_policy_config: Policy config from request body (optional)
        profile_config: Policy config from user's active profile
        
    Returns:
        Merged policy configuration
    """
    if request_policy_config:
        # If request provides policy_config, use it but add profile metadata
        merged = {**profile_config, **request_policy_config}
        logger.info("Using request-provided policy_config with profile metadata")
        return merged
    else:
        # Use profile config
        logger.info(f"Using profile config: {profile_config.get('profile_name', 'Unknown')}")
        return profile_config
