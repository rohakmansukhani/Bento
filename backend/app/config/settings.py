"""
Centralized Settings and Environment Configuration
All environment variables and application settings in one place.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True
    
    # API Configuration
    API_TITLE: str = "Bento API"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Security (optional for development)
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://bento-privacy.vercel.app",
        "https://bento-privacy.vercel.app/"
    ]
    
    # Database (Supabase)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""  # Service role key
    SUPABASE_JWT_SECRET: str = ""
    
    # Redis
    UPSTASH_REDIS_URL: str = "redis://localhost:6379"
    REDIS_TTL_PENDING: int = 300  # 5 minutes
    REDIS_TTL_CACHE: int = 600  # 10 minutes
    
    # External Services
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Request Limits
    MAX_PAYLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    REQUEST_TIMEOUT: int = 30  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    
    # Monitoring
    ENABLE_METRICS: bool = True
    SENTRY_DSN: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


# Singleton instance
settings = Settings()


# Derived configurations
def get_cors_config() -> dict:
    """Get CORS middleware configuration"""
    return {
        "allow_origins": settings.ALLOWED_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["*"],
        "max_age": 3600
    }


def get_database_config() -> dict:
    """Get database configuration"""
    return {
        "url": settings.SUPABASE_URL,
        "key": settings.SUPABASE_KEY,
        "jwt_secret": settings.SUPABASE_JWT_SECRET
    }


def is_production() -> bool:
    """Check if running in production"""
    return settings.ENVIRONMENT == "production"


def is_development() -> bool:
    """Check if running in development"""
    return settings.ENVIRONMENT == "development"



# Derived configurations
def get_cors_config() -> dict:
    """Get CORS middleware configuration"""
    return {
        "allow_origins": settings.ALLOWED_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["*"],
        "max_age": 3600
    }


def get_database_config() -> dict:
    """Get database configuration"""
    return {
        "url": settings.SUPABASE_URL,
        "key": settings.SUPABASE_KEY,
        "jwt_secret": settings.SUPABASE_JWT_SECRET
    }


def is_production() -> bool:
    """Check if running in production"""
    return settings.ENVIRONMENT == "production"


def is_development() -> bool:
    """Check if running in development"""
    return settings.ENVIRONMENT == "development"
