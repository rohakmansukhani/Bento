from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.redaction import redactor
from app.core.security import get_api_key

router = APIRouter()

class ScanRequest(BaseModel):
    text: str

class ScanResponse(BaseModel):
    original: str
    redacted: str
    has_pii: bool

@router.post("/scan", response_model=ScanResponse, dependencies=[Depends(get_api_key)])
async def scan_text(request: ScanRequest):
    """
    Generic Text Scanner for Egress Filtering.
    Applies logic from redactor.py (Pattern Matching + NLP).
    """
    try:
        # We always use 'redact' mode for Egress to stay safe 
        # (Swapping might be confusing in output unless specifically requested)
        redacted = redactor.redact_text(request.text, mode="redact")
        
        has_pii = redacted != request.text
        
        return {
            "original": request.text,
            "redacted": redacted,
            "has_pii": has_pii
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")
