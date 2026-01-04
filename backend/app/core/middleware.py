"""
Performance Monitoring Middleware
Tracks request duration, logs slow requests, and adds metrics
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from time import time
from typing import Callable
import uuid

from app.core.logging import logger, log_performance, log_api


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor request performance
    - Tracks request duration
    - Logs slow requests
    - Adds performance headers
    - Generates request IDs
    """
    
    def __init__(self, app: ASGIApp, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold  # seconds
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timer
        start_time = time()
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error
            duration_ms = (time() - start_time) * 1000
            log_api(
                f"Request failed: {request.method} {request.url.path}",
                level="ERROR",
                request_id=request_id,
                duration_ms=duration_ms,
                error=str(e)
            )
            raise
        
        # Calculate duration
        duration_ms = (time() - start_time) * 1000
        
        # Add performance headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"
        
        # Log request
        log_message = f"{request.method} {request.url.path} - {response.status_code}"
        
        if duration_ms > (self.slow_request_threshold * 1000):
            # Log slow requests as warnings
            log_performance(
                f"SLOW REQUEST: {log_message}",
                duration_ms=duration_ms,
                request_id=request_id,
                method=request.method,
                path=str(request.url.path),
                status_code=response.status_code
            )
        else:
            # Log normal requests as info
            log_api(
                log_message,
                level="INFO",
                request_id=request_id,
                duration_ms=duration_ms,
                method=request.method,
                path=str(request.url.path),
                status_code=response.status_code
            )
        
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to limit request payload size
    Prevents memory exhaustion from large payloads
    """
    
    def __init__(self, app: ASGIApp, max_content_length: int = 10 * 1024 * 1024):
        super().__init__(app)
        self.max_content_length = max_content_length  # bytes
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check content length
        content_length = request.headers.get("content-length")
        
        if content_length:
            content_length = int(content_length)
            if content_length > self.max_content_length:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": f"Request payload too large. Maximum size: {self.max_content_length} bytes"
                    }
                )
        
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
