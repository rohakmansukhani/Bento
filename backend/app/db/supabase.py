"""
Database Connection Management
Singleton pattern for Supabase client to enable connection pooling
"""
from supabase import create_client, Client
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Get singleton Supabase client instance
    Uses LRU cache to ensure only one client is created
    """
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
    
    return create_client(url, key)


# Singleton instance
supabase = get_supabase_client()


def get_authenticated_client(jwt_token: str) -> Client:
    """
    Get Supabase client with user authentication
    
    Args:
        jwt_token: User's JWT token
        
    Returns:
        Authenticated Supabase client
    """
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    
    client = create_client(url, key)
    client.auth.set_session(jwt_token, "")  # Set user session
    
    return client
