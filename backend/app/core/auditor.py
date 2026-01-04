import os
import json
from groq import Groq
from typing import Dict, Any, Tuple, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

load_dotenv()

# Default System Prompt for Compliance
# Default System Prompt for Compliance
DEFAULT_SYSTEM_PROMPT = """
You are "Bento SENSE", an automated compliance auditor for enterprise AI operations.
Your job is to evaluate JSON payloads against a business policy.

You must output a JSON object with the EXACT following structure:
{
    "verdict": "VALID" | "FLAGGED" | "REJECTED",
    "compliance_score": float (0.0 to 1.0),
    "reasoning": "string explanation"
}

Do not include any other keys. Do not include markdown formatting.
If you are unsure, default to "FLAGGED" with a low score.

FAIL if:
- The payload contains unredacted PII (Emails, API Keys).
- The payload mentions "competitor_X" or "Project: Manhattan".
- The sentiment is aggressively hostile.

PASS if:
- Data is clean, structured, and business-relevant.
"""

class AuditResult(BaseModel):
    verdict: str
    compliance_score: float
    reasoning: str

class GroqAuditor:
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            print("Warning: GROQ_API_KEY not found. Auditor will run in MOCK mode.")
            self.client = None
        else:
            self.client = Groq(api_key=api_key)
            
        self.model = "llama-3.3-70b-versatile"

    def audit_payload(self, payload: Dict[str, Any], policy_prompt: str = DEFAULT_SYSTEM_PROMPT) -> AuditResult:
        """
        Sends the payload to Groq (Llama 3) for compliance evaluation.
        Returns a Pydantic AuditResult model.
        """
        if not self.client:
            # Mock Response for testing without API Key
            return AuditResult(
                verdict="VALID",
                compliance_score=0.95,
                reasoning="MOCK MODE: No API Key provided. Payload assumed valid."
            )

        try:
            # 0. Prompt Injection / Jailbreak Guard (Simple Heuristic)
            payload_str = json.dumps(payload).lower()
            if "ignore all previous instructions" in payload_str or "ignore your instructions" in payload_str:
                return AuditResult(
                    verdict="REJECTED",
                    compliance_score=0.0,
                    reasoning="[THREAT] JAILBREAK_ATTEMPT_DETECTED: Prompt Injection pattern match."
                )

            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": policy_prompt + "\n\nIMPORTANT: You must output a valid JSON object with keys: verdict, compliance_score, reasoning."
                    },
                    {
                        "role": "user",
                        "content": f"Evaluate this payload:\n{json.dumps(payload, indent=2)}"
                    }
                ],
                model=self.model,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            response_content = chat_completion.choices[0].message.content
            
            # Validate with Pydantic
            try:
                parsed_json = json.loads(response_content)
                
                # Heuristic: Fix common hallucinated keys
                if "evaluation" in parsed_json and "reasoning" not in parsed_json:
                    parsed_json["reasoning"] = parsed_json["evaluation"]
                if "status" in parsed_json and "verdict" not in parsed_json:
                    parsed_json["verdict"] = parsed_json["status"].upper()
                if "score" in parsed_json and "compliance_score" not in parsed_json:
                    parsed_json["compliance_score"] = float(parsed_json["score"])
                
                return AuditResult(**parsed_json)
            except (json.JSONDecodeError, ValidationError) as e:
                print(f"Validation Error: {e}")
                print(f"Raw Response: {response_content}") # Log raw response for debugging
                
                # Fail-Secure: If output is malformed, we flag it.
                return AuditResult(
                    verdict="FLAGGED",
                    compliance_score=0.0,
                    reasoning=f"AI Output Verification Failed. Raw Output: {response_content[:100]}..."
                )

        except Exception as e:
            print(f"Auditing Error: {e}")
            # Fail-Secure: System error = Flagged.
            return AuditResult(
                verdict="FLAGGED",
                compliance_score=0.0,
                reasoning=f"Auditor System Error: {str(e)}"
            )

auditor = GroqAuditor()
