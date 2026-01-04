"""
Structured Logging Configuration
Centralized logging with JSON formatting for production
"""
import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict
from pathlib import Path

from app.config import settings, LogLevels, LogCategories


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "category"):
            log_data["category"] = record.category
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        
        return json.dumps(log_data)


class TextFormatter(logging.Formatter):
    """
    Human-readable formatter for development
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as readable text"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        level = record.levelname
        name = record.name
        message = record.getMessage()
        
        # Color codes for terminal
        colors = {
            "DEBUG": "\033[36m",    # Cyan
            "INFO": "\033[32m",     # Green
            "WARNING": "\033[33m",  # Yellow
            "ERROR": "\033[31m",    # Red
            "CRITICAL": "\033[35m", # Magenta
        }
        reset = "\033[0m"
        
        color = colors.get(level, "")
        formatted = f"{timestamp} {color}[{level}]{reset} {name}: {message}"
        
        if record.exc_info:
            formatted += "\n" + self.formatException(record.exc_info)
        
        return formatted


def setup_logging():
    """
    Configure application logging
    """
    # Determine log level
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Create logger
    logger = logging.getLogger("bento")
    logger.setLevel(log_level)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Choose formatter based on environment
    if settings.LOG_FORMAT == "json" or settings.ENVIRONMENT == "production":
        formatter = JSONFormatter()
    else:
        formatter = TextFormatter()
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Don't propagate to root logger
    logger.propagate = False
    
    return logger


# Create application logger
logger = setup_logging()


# Convenience functions for categorized logging
def log_auth(message: str, level: str = "INFO", **kwargs):
    """Log authentication events"""
    extra = {"category": LogCategories.AUTH, **kwargs}
    getattr(logger, level.lower())(message, extra=extra)


def log_api(message: str, level: str = "INFO", **kwargs):
    """Log API events"""
    extra = {"category": LogCategories.API, **kwargs}
    getattr(logger, level.lower())(message, extra=extra)


def log_database(message: str, level: str = "INFO", **kwargs):
    """Log database events"""
    extra = {"category": LogCategories.DATABASE, **kwargs}
    getattr(logger, level.lower())(message, extra=extra)


def log_security(message: str, level: str = "WARNING", **kwargs):
    """Log security events"""
    extra = {"category": LogCategories.SECURITY, **kwargs}
    getattr(logger, level.lower())(message, extra=extra)


def log_performance(message: str, duration_ms: float, **kwargs):
    """Log performance metrics"""
    extra = {"category": LogCategories.PERFORMANCE, "duration_ms": duration_ms, **kwargs}
    
    # Warn on slow requests
    if duration_ms > 1000:
        logger.warning(message, extra=extra)
    else:
        logger.info(message, extra=extra)
