"""
Timeout Middleware
Prevents hanging requests by enforcing timeouts
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Callable
import asyncio

from app.config import settings
from app.core.logging import log_api


class TimeoutMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce request timeouts
    Prevents hanging requests and resource exhaustion
    """
    
    def __init__(self, app: ASGIApp, timeout: float = 30.0):
        super().__init__(app)
        self.timeout = timeout
    
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            # Wait for response with timeout
            response = await asyncio.wait_for(
                call_next(request),
                timeout=self.timeout
            )
            return response
            
        except asyncio.TimeoutError:
            # Log timeout
            log_api(
                f"Request timeout: {request.method} {request.url.path}",
                level="ERROR",
                timeout=self.timeout,
                path=str(request.url.path)
            )
            
            # Return 504 Gateway Timeout
            return JSONResponse(
                status_code=504,
                content={
                    "detail": f"Request timeout after {self.timeout}s",
                    "path": str(request.url.path)
                }
            )
