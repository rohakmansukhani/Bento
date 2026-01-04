"""
Centralized Constants
All application constants in one place.
"""
from enum import Enum


# ============================================================================
# STATUS CONSTANTS
# ============================================================================

class ChatStatus(str, Enum):
    """Chat status enumeration"""
    IDLE = "IDLE"
    SCANNING = "SCANNING"
    INTERCEPTED = "INTERCEPTED"
    RESUMING = "RESUMING"


class VerdictType(str, Enum):
    """Audit verdict types"""
    VALID = "VALID"
    FLAGGED = "FLAGGED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"


class PIIType(str, Enum):
    """Types of PII that can be detected"""
    EMAIL = "email"
    PHONE = "phone"
    CREDIT_CARD = "credit_card"
    SSN = "ssn"
    API_KEY = "api_key"
    PERSON = "PERSON"
    ORG = "ORG"
    GPE = "GPE"
    CUSTOM_KEYWORD = "CUSTOM_KEYWORD"


# ============================================================================
# PROFILE CONSTANTS
# ============================================================================

class ProfileIcons:
    """Available profile icons"""
    BRIEFCASE = "Briefcase"
    BOOK = "BookOpen"
    HOME = "Home"
    TERMINAL = "Terminal"
    SHIELD = "Shield"
    LOCK = "Lock"
    
    ALL = [BRIEFCASE, BOOK, HOME, TERMINAL, SHIELD, LOCK]


class ProfileColors:
    """Available profile colors (Tailwind classes)"""
    AMBER = "text-amber_neon"
    EMERALD = "text-emerald-400"
    SKY = "text-sky-400"
    VIOLET = "text-violet-400"
    ROSE = "text-rose-400"
    
    ALL = [AMBER, EMERALD, SKY, VIOLET, ROSE]


# ============================================================================
# API CONSTANTS
# ============================================================================

class HTTPStatus:
    """HTTP status codes"""
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    CONFLICT = 409
    TOO_MANY_REQUESTS = 429
    INTERNAL_ERROR = 500
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503
    GATEWAY_TIMEOUT = 504


class APIRoutes:
    """API route constants"""
    # Base
    API_V1 = "/api/v1"
    
    # Endpoints
    INTERCEPT = f"{API_V1}/intercept"
    CONFIRM = f"{API_V1}/intercept/confirm"
    CANCEL = f"{API_V1}/intercept/cancel"
    PROFILES = f"{API_V1}/profiles"
    ANALYTICS = f"{API_V1}/analytics"
    HISTORY = f"{API_V1}/history"
    EXPORT = f"{API_V1}/export"
    HEALTH = "/health"
    METRICS = "/metrics"


# ============================================================================
# CACHE KEYS
# ============================================================================

class CacheKeys:
    """Redis cache key patterns"""
    PENDING_REQUEST = "pending:{request_id}"
    USER_PROFILE = "profile:{user_id}"
    ACTIVE_PROFILE = "active_profile:{user_id}"
    ANALYTICS = "analytics:{user_id}:{range}"
    SESSION = "session:{session_id}"
    
    @staticmethod
    def pending(request_id: str) -> str:
        return f"pending:{request_id}"
    
    @staticmethod
    def profile(user_id: str) -> str:
        return f"profile:{user_id}"
    
    @staticmethod
    def analytics(user_id: str, time_range: str) -> str:
        return f"analytics:{user_id}:{time_range}"


# ============================================================================
# TIME CONSTANTS
# ============================================================================

class TimeConstants:
    """Time-related constants in seconds"""
    SECOND = 1
    MINUTE = 60
    HOUR = 3600
    DAY = 86400
    WEEK = 604800
    
    # Cache TTLs
    TTL_PENDING = 300  # 5 minutes
    TTL_PROFILE = 600  # 10 minutes
    TTL_ANALYTICS = 300  # 5 minutes
    TTL_SESSION = 86400  # 24 hours
    
    # Timeouts
    REQUEST_TIMEOUT = 30
    LLM_TIMEOUT = 60
    DATABASE_TIMEOUT = 10


# ============================================================================
# SIZE LIMITS
# ============================================================================

class SizeLimits:
    """Size limit constants in bytes"""
    KB = 1024
    MB = 1024 * 1024
    GB = 1024 * 1024 * 1024
    
    # Request limits
    MAX_PAYLOAD_SIZE = 10 * MB
    MAX_FILE_SIZE = 50 * MB
    MAX_BATCH_SIZE = 100
    
    # Text limits
    MAX_PROMPT_LENGTH = 100000  # characters
    MAX_KEYWORD_LENGTH = 100
    MAX_KEYWORDS_COUNT = 50


# ============================================================================
# RATE LIMITS
# ============================================================================

class RateLimits:
    """Rate limiting constants"""
    # Per endpoint
    INTERCEPT_LIMIT = 100  # requests per minute
    PROFILES_LIMIT = 50
    ANALYTICS_LIMIT = 30
    CONFIRM_LIMIT = 100
    
    # Global
    GLOBAL_LIMIT = 1000  # requests per minute per user


# ============================================================================
# ERROR MESSAGES
# ============================================================================

class ErrorMessages:
    """Standardized error messages"""
    # Authentication
    UNAUTHORIZED = "Authentication required"
    INVALID_TOKEN = "Invalid or expired token"
    MISSING_HEADER = "Missing Authorization header"
    
    # Validation
    INVALID_PAYLOAD = "Invalid payload format"
    PAYLOAD_TOO_LARGE = "Payload exceeds maximum size"
    MISSING_REQUIRED_FIELD = "Missing required field: {field}"
    
    # Resources
    NOT_FOUND = "Resource not found"
    PROFILE_NOT_FOUND = "Profile not found"
    USER_NOT_FOUND = "User not found"
    
    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "Rate limit exceeded. Please try again later."
    
    # Server
    INTERNAL_ERROR = "Internal server error"
    SERVICE_UNAVAILABLE = "Service temporarily unavailable"
    TIMEOUT = "Request timeout"
    
    # Business Logic
    NO_ACTIVE_PROFILE = "No active profile selected"
    PROFILE_ALREADY_ACTIVE = "Profile is already active"
    CANNOT_DELETE_ACTIVE = "Cannot delete active profile"


# ============================================================================
# SUCCESS MESSAGES
# ============================================================================

class SuccessMessages:
    """Standardized success messages"""
    PROFILE_CREATED = "Profile created successfully"
    PROFILE_UPDATED = "Profile updated successfully"
    PROFILE_DELETED = "Profile deleted successfully"
    PROFILE_ACTIVATED = "Profile activated successfully"
    REQUEST_PROCESSED = "Request processed successfully"


# ============================================================================
# REGEX PATTERNS
# ============================================================================

class RegexPatterns:
    """Common regex patterns"""
    EMAIL = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    PHONE = r'\b(?:\+?1?[-.]?\(?\d{3}\)?[-.]?)?\d{3}[-.]?\d{4}\b'
    CREDIT_CARD = r'\b(?:\d{4}[- ]?){3}\d{4}\b'
    SSN = r'\b\d{3}-\d{2}-\d{4}\b'
    API_KEY = r'sk-[a-zA-Z0-9]{20,}'
    UUID = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'


# ============================================================================
# LOGGING CONSTANTS
# ============================================================================

class LogLevels:
    """Logging levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogCategories:
    """Log categories for structured logging"""
    AUTH = "auth"
    API = "api"
    DATABASE = "database"
    CACHE = "cache"
    REDACTION = "redaction"
    AUDIT = "audit"
    PERFORMANCE = "performance"
    SECURITY = "security"
