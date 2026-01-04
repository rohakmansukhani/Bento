"""
Health Check Endpoint
Provides system health status for monitoring and load balancers
"""
from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import asyncio

from app.config import settings
from app.db.supabase import supabase

router = APIRouter()


class HealthStatus(BaseModel):
    """Health check response model"""
    status: str
    timestamp: str
    version: str
    environment: str
    checks: Dict[str, Any]


async def check_database() -> Dict[str, Any]:
    """Check database connectivity"""
    try:
        # Simple query to test connection
        result = supabase.table("audit_logs").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "latency_ms": 0,  # Could add timing here
            "message": "Database connection successful"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Database connection failed"
        }


async def check_redis() -> Dict[str, Any]:
    """Check Redis connectivity"""
    try:
        import redis.asyncio as redis
        import os
        
        redis_url = os.environ.get("UPSTASH_REDIS_URL")
        if not redis_url:
            return {
                "status": "skipped",
                "message": "Redis URL not configured"
            }
        
        r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        await r.ping()
        await r.close()
        
        return {
            "status": "healthy",
            "message": "Redis connection successful"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Redis connection failed"
        }


@router.get("/health", response_model=HealthStatus, status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint for monitoring
    
    Returns:
        - status: overall system status
        - timestamp: current server time
        - version: API version
        - environment: current environment
        - checks: individual component health checks
    """
    # Run health checks in parallel
    db_check, redis_check = await asyncio.gather(
        check_database(),
        check_redis(),
        return_exceptions=True
    )
    
    # Handle exceptions from gather
    if isinstance(db_check, Exception):
        db_check = {"status": "unhealthy", "error": str(db_check)}
    if isinstance(redis_check, Exception):
        redis_check = {"status": "unhealthy", "error": str(redis_check)}
    
    # Determine overall status
    all_healthy = (
        db_check.get("status") == "healthy" and
        (redis_check.get("status") in ["healthy", "skipped"])
    )
    
    overall_status = "healthy" if all_healthy else "degraded"
    
    return HealthStatus(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat(),
        version=settings.API_VERSION,
        environment=settings.ENVIRONMENT,
        checks={
            "database": db_check,
            "redis": redis_check
        }
    )


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def liveness_probe():
    """
    Kubernetes liveness probe
    Returns 200 if service is running
    """
    return {"status": "alive"}


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_probe():
    """
    Kubernetes readiness probe
    Returns 200 if service is ready to accept traffic
    """
    # Check critical dependencies
    try:
        db_check = await check_database()
        if db_check.get("status") != "healthy":
            return {"status": "not_ready", "reason": "database_unavailable"}, 503
        
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "reason": str(e)}, 503
