"""
Centralized AI Prompts and System Instructions
All LLM prompts and system instructions in one place.
"""
from typing import Dict, Any


# ============================================================================
# SYSTEM PROMPTS
# ============================================================================

class SystemPrompts:
    """Centralized system prompts for AI models"""
    
    DEFAULT_SYSTEM = """You are Bento, a privacy-first AI assistant. 
Your primary goal is to help users while protecting their sensitive information.
Always be helpful, accurate, and respectful of user privacy."""
    
    PRIVACY_AUDITOR = """You are a privacy compliance auditor for Bento.
Your role is to analyze data payloads and identify potential privacy violations.

Analyze the following data and determine:
1. Does it contain PII (Personally Identifiable Information)?
2. What specific types of sensitive data are present?
3. What is the compliance risk level (LOW, MEDIUM, HIGH, CRITICAL)?
4. Should this data be blocked, redacted, or allowed?

Respond in JSON format with:
{
    "verdict": "VALID|FLAGGED|BLOCKED",
    "compliance_score": 0-100,
    "reasoning": "explanation",
    "detected_pii_types": ["email", "phone", "ssn", etc.]
}"""
    
    REDACTION_ASSISTANT = """You are a data redaction specialist.
Your task is to identify and redact sensitive information while preserving data utility.

Focus on:
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- API keys and secrets
- Personal names
- Addresses
- Medical information

Redact thoroughly but preserve data structure and context."""
    
    POLICY_GENERATOR = """You are a privacy policy generator.
Based on user preferences and data types, generate appropriate privacy policies.

Consider:
- Data types being processed
- User consent requirements
- Regulatory compliance (GDPR, CCPA, HIPAA)
- Data retention policies
- Third-party sharing rules"""


# ============================================================================
# PROMPT TEMPLATES
# ============================================================================

class PromptTemplates:
    """Reusable prompt templates with variables"""
    
    AUDIT_PAYLOAD = """Analyze this data payload for privacy compliance:

Payload:
{payload}

Privacy Policy:
{policy}

Provide a detailed compliance assessment."""
    
    REDACT_WITH_POLICY = """Redact sensitive information from this data according to the policy:

Data:
{data}

Policy Rules:
- Redact emails: {redact_email}
- Redact phones: {redact_phone}
- Redact names: {redact_names}
- Redact payment info: {redact_payment}
- Redact locations: {redact_location}
- Redact credentials: {redact_credentials}
- Custom keywords: {custom_keywords}

Return the redacted version."""
    
    EXPLAIN_VIOLATION = """Explain why this data was flagged:

Original: {original}
Redacted: {redacted}
Violations: {violations}

Provide a user-friendly explanation of the privacy concerns."""
    
    GENERATE_POLICY = """Generate a privacy policy based on these settings:

Profile: {profile_name}
Protected Data Types: {protected_types}
Custom Rules: {custom_rules}
Compliance Requirements: {compliance}

Create a clear, concise privacy policy."""


# ============================================================================
# CONTEXT BUILDERS
# ============================================================================

class ContextBuilders:
    """Functions to build context for prompts"""
    
    @staticmethod
    def build_policy_context(profile: Dict[str, Any]) -> str:
        """Build policy context from profile settings"""
        protected = []
        if profile.get("redact_email"): protected.append("email addresses")
        if profile.get("redact_phone"): protected.append("phone numbers")
        if profile.get("redact_names"): protected.append("personal names")
        if profile.get("redact_payment"): protected.append("payment information")
        if profile.get("redact_location"): protected.append("location data")
        if profile.get("redact_credentials"): protected.append("credentials and secrets")
        
        policy = f"Privacy Profile: {profile.get('name', 'Default')}\n"
        policy += f"Protected Data: {', '.join(protected)}\n"
        
        if profile.get("custom_keywords"):
            policy += f"Custom Keywords: {', '.join(profile['custom_keywords'])}\n"
        
        return policy
    
    @staticmethod
    def build_audit_context(payload: Any, policy: str) -> str:
        """Build context for audit prompt"""
        return PromptTemplates.AUDIT_PAYLOAD.format(
            payload=str(payload),
            policy=policy
        )
    
    @staticmethod
    def build_redaction_context(data: str, profile: Dict[str, Any]) -> str:
        """Build context for redaction prompt"""
        return PromptTemplates.REDACT_WITH_POLICY.format(
            data=data,
            redact_email=profile.get("redact_email", True),
            redact_phone=profile.get("redact_phone", True),
            redact_names=profile.get("redact_names", True),
            redact_payment=profile.get("redact_payment", True),
            redact_location=profile.get("redact_location", True),
            redact_credentials=profile.get("redact_credentials", True),
            custom_keywords=", ".join(profile.get("custom_keywords", []))
        )


# ============================================================================
# RESPONSE FORMATS
# ============================================================================

class ResponseFormats:
    """Expected response formats from AI"""
    
    AUDIT_RESPONSE = {
        "verdict": "VALID|FLAGGED|BLOCKED",
        "compliance_score": "0-100",
        "reasoning": "string",
        "detected_pii_types": ["array", "of", "strings"],
        "recommendations": "string (optional)"
    }
    
    REDACTION_RESPONSE = {
        "redacted_text": "string",
        "redaction_count": "integer",
        "redacted_types": ["array", "of", "types"]
    }


# ============================================================================
# PROMPT UTILITIES
# ============================================================================

def get_system_prompt(prompt_type: str = "default") -> str:
    """Get system prompt by type"""
    prompts = {
        "default": SystemPrompts.DEFAULT_SYSTEM,
        "auditor": SystemPrompts.PRIVACY_AUDITOR,
        "redactor": SystemPrompts.REDACTION_ASSISTANT,
        "policy": SystemPrompts.POLICY_GENERATOR
    }
    return prompts.get(prompt_type, SystemPrompts.DEFAULT_SYSTEM)


def format_prompt(template: str, **kwargs) -> str:
    """Format a prompt template with variables"""
    return template.format(**kwargs)
