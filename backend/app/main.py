"""
Bento API - Main Application
Production-ready FastAPI application with centralized configuration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import redis.asyncio as redis
from fastapi_limiter import FastAPILimiter

# Centralized configuration
from app.config import settings, get_cors_config, APIRoutes

# Middleware
from app.core.middleware import (
    PerformanceMonitoringMiddleware,
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware
)
from app.core.timeout import TimeoutMiddleware

# Logging
from app.core.logging import logger, log_api

# API Routers
from app.api.endpoints import (
    intercept,
    confirm,
    analytics,
    history,
    cancel,
    policies,
    profiles,
    health
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info(f"Starting Bento API v{settings.API_VERSION} in {settings.ENVIRONMENT} mode")
    
    # Initialize Redis for rate limiting
    try:
        redis_connection = redis.from_url(
            settings.UPSTASH_REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await FastAPILimiter.init(redis_connection)
        logger.info("Redis connection initialized for rate limiting")
    except Exception as e:
        logger.error(f"Failed to initialize Redis: {e}")
        # Continue without rate limiting in development
        if settings.ENVIRONMENT == "production":
            raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Bento API")
    try:
        await redis_connection.close()
        logger.info("Redis connection closed")
    except:
        pass


# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description="Privacy-first AI Gateway with Operational Integrity",
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)


# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# CORS Middleware
cors_config = get_cors_config()
app.add_middleware(
    CORSMiddleware,
    **cors_config
)

# Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# Request Timeout (30 seconds)
app.add_middleware(
    TimeoutMiddleware,
    timeout=settings.REQUEST_TIMEOUT
)

# Request Size Limit
app.add_middleware(
    RequestSizeLimitMiddleware,
    max_content_length=settings.MAX_PAYLOAD_SIZE
)

# Performance Monitoring
app.add_middleware(
    PerformanceMonitoringMiddleware,
    slow_request_threshold=1.0  # 1 second
)


# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Bento System Online",
        "status": "operational",
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT
    }


# ============================================================================
# API ROUTERS
# ============================================================================

# Health checks (no prefix)
app.include_router(health.router, tags=["Health"])

# API v1 endpoints
app.include_router(
    intercept.router,
    prefix=settings.API_PREFIX,
    tags=["Traffic Interceptor"]
)
app.include_router(
    confirm.router,
    prefix=settings.API_PREFIX,
    tags=["Traffic Interceptor"]
)
app.include_router(
    cancel.router,
    prefix=settings.API_PREFIX,
    tags=["Cancel"]
)
app.include_router(
    analytics.router,
    prefix=settings.API_PREFIX,
    tags=["Analytics"]
)
app.include_router(
    history.router,
    prefix=settings.API_PREFIX,
    tags=["History"]
)
app.include_router(
    policies.router,
    prefix=settings.API_PREFIX,
    tags=["Policies"]
)
app.include_router(
    profiles.router,
    prefix=f"{settings.API_PREFIX}/profiles",
    tags=["User Profiles"]
)


# ============================================================================
# STARTUP EVENT LOGGING
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    log_api(
        f"Bento API started successfully",
        level="INFO",
        version=settings.API_VERSION,
        environment=settings.ENVIRONMENT,
        debug=settings.DEBUG
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown information"""
    log_api("Bento API shutting down", level="INFO")
