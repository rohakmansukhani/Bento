from fastapi import Security, HTTPException, status, Request, Depends
from fastapi.security import APIKeyHeader
import os
import httpx
from dotenv import load_dotenv
from jose import jwt, jwk
from jose.utils import base64url_decode

load_dotenv()

API_KEY_NAME = "X-Bento-Secret-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    """
    Verifies the X-Bento-Secret-Key header against the BENTO_SECRET_KEY env var.
    """
    bento_secret = os.environ.get("BENTO_SECRET_KEY")
    
    first_check = os.environ.get("BENTO_SECRET_KEY")
    if not first_check:
        # logging.warning("BENTO_SECRET_KEY not set! API is open.") 
        return api_key_header 
    
    # Check again (redundant but safe)
    bento_secret = os.environ.get("BENTO_SECRET_KEY") 

    if api_key_header == bento_secret:
        return api_key_header

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials",
    )

# JWKS Cache
jwks_client = httpx.AsyncClient()
cached_jwks = None

async def get_jwks():
    global cached_jwks
    if cached_jwks:
        return cached_jwks
        
    supabase_url = os.environ.get("SUPABASE_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Server Configuration Error")
        
    try:
        url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        response = await jwks_client.get(url)
        response.raise_for_status()
        cached_jwks = response.json()
        return cached_jwks
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        raise HTTPException(status_code=500, detail="Auth System Unavailable")

async def get_current_user(request: Request):
    """
    Validates Supabase JWT using JWKS (Asymmetric Keys).
    Expects: Authorization: Bearer <token>
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    
    try:
        # Get Key ID (kid) from token header
        headers = jwt.get_unverified_headers(token)
        kid = headers.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid Token Header")

        # Fetch JWKS
        jwks = await get_jwks()
        
        # Find matching key
        key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if not key_data:
            # Force refresh cache once if key not found (key rotation)
            global cached_jwks
            cached_jwks = None
            jwks = await get_jwks()
            key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
            
        if not key_data:
            raise HTTPException(status_code=401, detail="Public Key Not Found")

        # Construct Public Key
        public_key = jwk.construct(key_data)
        
        # Verify Token
        # Supabase defaults to RS256 for new projects, but check alg in header
        alg = headers.get("alg", "RS256")
        
        payload = jwt.decode(
            token, 
            public_key.to_pem().decode("utf-8"), 
            algorithms=[alg],
            options={"verify_aud": False} 
        )
        return payload 
        
    except Exception as e:
        print(f"JWT Verification Failed: {e}")
        raise HTTPException(status_code=401, detail="Token validation failed")
