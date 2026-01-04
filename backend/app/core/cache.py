"""
Redis Caching Utilities
Decorators and utilities for caching with Redis
"""
import json
import redis.asyncio as redis
from functools import wraps
from typing import Any, Callable, Optional
import os
from app.core.logging import logger


# Redis client singleton
_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Get or create Redis client"""
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.environ.get("UPSTASH_REDIS_URL", "redis://localhost:6379")
        _redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    
    return _redis_client


def cache_result(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis
    
    Args:
        ttl: Time to live in seconds (default 5 minutes)
        key_prefix: Optional prefix for cache key
        
    Usage:
        @cache_result(ttl=600, key_prefix="profiles")
        async def get_user_profiles(user_id: str):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Build cache key
            key_parts = [key_prefix or func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)
            
            try:
                # Try to get from cache
                r = await get_redis_client()
                cached = await r.get(cache_key)
                
                if cached:
                    logger.debug(f"Cache HIT: {cache_key}")
                    return json.loads(cached)
                
                # Cache miss - call function
                logger.debug(f"Cache MISS: {cache_key}")
                result = await func(*args, **kwargs)
                
                # Store in cache
                await r.setex(cache_key, ttl, json.dumps(result))
                
                return result
                
            except Exception as e:
                # If Redis fails, just call the function
                logger.warning(f"Cache error: {e}, falling back to direct call")
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern
    
    Args:
        pattern: Redis key pattern (e.g., "profiles:user123:*")
    """
    try:
        r = await get_redis_client()
        keys = await r.keys(pattern)
        if keys:
            await r.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries matching {pattern}")
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")


async def get_cached(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        r = await get_redis_client()
        value = await r.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        return None


async def set_cached(key: str, value: Any, ttl: int = 300):
    """Set value in cache"""
    try:
        r = await get_redis_client()
        await r.setex(key, ttl, json.dumps(value))
    except Exception as e:
        logger.error(f"Cache set error: {e}")
