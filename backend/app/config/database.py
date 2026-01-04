"""
Centralized Database Configuration
All database schemas, table names, and queries in one place.
"""
from typing import Dict, Any


# ============================================================================
# TABLE NAMES
# ============================================================================

class Tables:
    """Centralized table name constants"""
    AUDIT_LOGS = "audit_logs"
    USER_PROFILES = "user_profiles"
    USERS = "users"  # Supabase auth.users


# ============================================================================
# DATABASE SCHEMAS
# ============================================================================

class ProfileSchema:
    """User profile schema definition"""
    
    FIELDS = [
        "id",
        "user_id",
        "name",
        "icon_name",
        "color",
        "description",
        "is_active",
        "redact_email",
        "redact_phone",
        "redact_names",
        "redact_payment",
        "redact_location",
        "redact_credentials",
        "custom_keywords",
        "created_at",
        "updated_at"
    ]
    
    REQUIRED_FIELDS = ["user_id", "name", "icon_name"]
    
    @staticmethod
    def to_dict(profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert profile data to database format"""
        return {
            "user_id": profile_data["user_id"],
            "name": profile_data["name"],
            "icon_name": profile_data["icon_name"],
            "color": profile_data.get("color", "text-amber_neon"),
            "description": profile_data.get("description", "Custom user profile"),
            "is_active": profile_data.get("is_active", False),
            "redact_email": profile_data.get("redact_email", True),
            "redact_phone": profile_data.get("redact_phone", True),
            "redact_names": profile_data.get("redact_names", True),
            "redact_payment": profile_data.get("redact_payment", True),
            "redact_location": profile_data.get("redact_location", True),
            "redact_credentials": profile_data.get("redact_credentials", True),
            "custom_keywords": profile_data.get("custom_keywords", [])
        }


class AuditLogSchema:
    """Audit log schema definition"""
    
    FIELDS = [
        "id",
        "payload_raw",
        "payload_redacted",
        "verdict",
        "compliance_score",
        "ai_reasoning",
        "has_pii",
        "metadata",
        "created_at"
    ]
    
    REQUIRED_FIELDS = ["payload_raw", "payload_redacted", "verdict"]
    
    @staticmethod
    def to_dict(log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert log data to database format"""
        return {
            "payload_raw": log_data["payload_raw"],
            "payload_redacted": log_data["payload_redacted"],
            "verdict": log_data["verdict"],
            "compliance_score": log_data.get("compliance_score", 0.0),
            "ai_reasoning": log_data.get("ai_reasoning", ""),
            "has_pii": log_data.get("has_pii", False),
            "metadata": log_data.get("metadata", {})
        }


# ============================================================================
# COMMON QUERIES
# ============================================================================

class Queries:
    """Centralized database queries"""
    
    # Profile Queries
    GET_USER_PROFILES = f"""
        SELECT * FROM {Tables.USER_PROFILES}
        WHERE user_id = %s
        ORDER BY created_at ASC
    """
    
    GET_ACTIVE_PROFILE = f"""
        SELECT * FROM {Tables.USER_PROFILES}
        WHERE user_id = %s AND is_active = true
        LIMIT 1
    """
    
    CREATE_PROFILE = f"""
        INSERT INTO {Tables.USER_PROFILES}
        (user_id, name, icon_name, color, description, is_active, 
         redact_email, redact_phone, redact_names, redact_payment, 
         redact_location, redact_credentials, custom_keywords)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """
    
    UPDATE_PROFILE = f"""
        UPDATE {Tables.USER_PROFILES}
        SET name = %s, icon_name = %s, color = %s, description = %s,
            redact_email = %s, redact_phone = %s, redact_names = %s,
            redact_payment = %s, redact_location = %s, redact_credentials = %s,
            custom_keywords = %s, updated_at = NOW()
        WHERE id = %s AND user_id = %s
        RETURNING *
    """
    
    DELETE_PROFILE = f"""
        DELETE FROM {Tables.USER_PROFILES}
        WHERE id = %s AND user_id = %s
    """
    
    ACTIVATE_PROFILE = f"""
        UPDATE {Tables.USER_PROFILES}
        SET is_active = true, updated_at = NOW()
        WHERE id = %s AND user_id = %s
        RETURNING *
    """
    
    # Audit Log Queries
    GET_RECENT_LOGS = f"""
        SELECT * FROM {Tables.AUDIT_LOGS}
        ORDER BY created_at DESC
        LIMIT %s
    """
    
    GET_LOGS_BY_TIMERANGE = f"""
        SELECT * FROM {Tables.AUDIT_LOGS}
        WHERE created_at >= %s
        ORDER BY created_at DESC
    """
    
    INSERT_AUDIT_LOG = f"""
        INSERT INTO {Tables.AUDIT_LOGS}
        (payload_raw, payload_redacted, verdict, compliance_score, 
         ai_reasoning, has_pii, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """


# ============================================================================
# DATABASE INDEXES (for documentation/migration)
# ============================================================================

RECOMMENDED_INDEXES = """
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_verdict ON audit_logs(verdict);
CREATE INDEX IF NOT EXISTS idx_audit_logs_has_pii ON audit_logs(has_pii);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_time_verdict ON audit_logs(created_at DESC, verdict);
"""
