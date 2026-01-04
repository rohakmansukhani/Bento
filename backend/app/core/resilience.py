"""
Circuit Breaker and Retry Logic
Resilient external API calls with automatic retries and circuit breaking
"""
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
import logging
from typing import Callable, Any
from functools import wraps

from app.core.logging import logger


# Circuit breaker decorator for external API calls
def with_circuit_breaker(
    max_attempts: int = 3,
    min_wait: int = 2,
    max_wait: int = 10,
    exceptions: tuple = (ConnectionError, TimeoutError)
):
    """
    Decorator to add circuit breaker pattern to functions
    
    Args:
        max_attempts: Maximum number of retry attempts
        min_wait: Minimum wait time between retries (seconds)
        max_wait: Maximum wait time between retries (seconds)
        exceptions: Tuple of exceptions to retry on
        
    Usage:
        @with_circuit_breaker(max_attempts=3)
        async def call_external_api():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(exceptions),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True
        )
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            try:
                return await func(*args, **kwargs)
            except exceptions as e:
                logger.error(f"Circuit breaker triggered for {func.__name__}: {e}")
                raise
        
        return wrapper
    return decorator


# Specific decorators for common use cases
def llm_circuit_breaker(func: Callable) -> Callable:
    """Circuit breaker specifically for LLM API calls"""
    return with_circuit_breaker(
        max_attempts=3,
        min_wait=2,
        max_wait=10,
        exceptions=(ConnectionError, TimeoutError, Exception)
    )(func)


def database_circuit_breaker(func: Callable) -> Callable:
    """Circuit breaker for database operations"""
    return with_circuit_breaker(
        max_attempts=2,
        min_wait=1,
        max_wait=5,
        exceptions=(ConnectionError, TimeoutError)
    )(func)


def external_api_circuit_breaker(func: Callable) -> Callable:
    """Circuit breaker for external API calls"""
    return with_circuit_breaker(
        max_attempts=3,
        min_wait=2,
        max_wait=10,
        exceptions=(ConnectionError, TimeoutError)
    )(func)
