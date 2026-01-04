"""
Pytest Configuration
"""
import pytest
import asyncio


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing"""
    from unittest.mock import MagicMock
    return MagicMock()


@pytest.fixture
def mock_redis_client():
    """Mock Redis client for testing"""
    from unittest.mock import AsyncMock
    return AsyncMock()
