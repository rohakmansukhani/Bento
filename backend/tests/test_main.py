"""
Backend Test Suite
Comprehensive tests for Bento API
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app

# Test client
client = TestClient(app)


# ============================================================================
# Health Check Tests
# ============================================================================

def test_root_endpoint():
    """Test root endpoint returns correct response"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "version" in data


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data


def test_liveness_probe():
    """Test Kubernetes liveness probe"""
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"


# ============================================================================
# Configuration Tests
# ============================================================================

def test_centralized_config_import():
    """Test that centralized config can be imported"""
    from app.config import settings, Tables, SystemPrompts
    
    assert settings.API_VERSION is not None
    assert Tables.USER_PROFILES == "user_profiles"
    assert SystemPrompts.DEFAULT_SYSTEM is not None


def test_constants_import():
    """Test that constants can be imported"""
    from app.config import ChatStatus, ErrorMessages, CacheKeys
    
    assert ChatStatus.IDLE == "IDLE"
    assert ErrorMessages.UNAUTHORIZED is not None
    assert CacheKeys.pending("test") == "pending:test"


# ============================================================================
# Middleware Tests
# ============================================================================

def test_performance_headers():
    """Test that performance monitoring adds headers"""
    response = client.get("/")
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers


def test_security_headers():
    """Test that security headers are present"""
    response = client.get("/")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


# ============================================================================
# API Endpoint Tests
# ============================================================================

@pytest.mark.asyncio
async def test_intercept_endpoint_requires_auth():
    """Test that intercept endpoint requires authentication"""
    response = client.post("/api/v1/intercept", json={})
    assert response.status_code in [401, 422]  # Unauthorized or validation error


# ============================================================================
# Logging Tests
# ============================================================================

def test_structured_logging():
    """Test that structured logging is configured"""
    from app.core.logging import logger, log_api
    
    assert logger is not None
    # Test logging functions don't raise errors
    log_api("Test message", level="INFO")


# ============================================================================
# Database Schema Tests
# ============================================================================

def test_profile_schema():
    """Test ProfileSchema utility functions"""
    from app.config import ProfileSchema
    
    test_data = {
        "user_id": "test-user",
        "name": "Test Profile",
        "icon_name": "Briefcase"
    }
    
    result = ProfileSchema.to_dict(test_data)
    assert result["user_id"] == "test-user"
    assert result["name"] == "Test Profile"
    assert result["redact_email"] == True  # Default value


# ============================================================================
# Prompt Tests
# ============================================================================

def test_prompt_templates():
    """Test prompt template system"""
    from app.config import get_system_prompt, PromptTemplates
    
    auditor_prompt = get_system_prompt("auditor")
    assert "privacy" in auditor_prompt.lower()
    
    # Test template formatting
    formatted = PromptTemplates.AUDIT_PAYLOAD.format(
        payload="test",
        policy="test policy"
    )
    assert "test" in formatted
