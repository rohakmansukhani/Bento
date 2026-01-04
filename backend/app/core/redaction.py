import re
import json
from typing import Any, Dict, Union
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model not found. Run 'python -m spacy download en_core_web_sm'")
    nlp = None

class RedactionService:
    def __init__(self):
        self.patterns = {
            "email": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            "phone": re.compile(r'\b(?:\+?1?[-.]?\(?\d{3}\)?[-.]?)?\d{3}[-.]?\d{4}\b'),
            "credit_card": re.compile(r'\b(?:\d{4}[- ]?){3}\d{4}\b'),
            "api_key": re.compile(r'sk-[a-zA-Z0-9]{20,}'), # Simple detection for SK- style keys
            "ssn": re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
        }
        
        # Local list of famous entities/locations to skip redaction
        self.public_whitelist = {
            "madrid", "london", "paris", "new york", "mumbai", "tokyo", "berlin", 
            "google", "apple", "microsoft", "amazon", "meta", "nvidia",
            "python", "javascript", "react", "nextjs",
            "elon musk", "bill gates", "steve jobs", "narendra modi", "openai", "groq", "bento"
        }
        
        self.personal_triggers = {
            "my", "live", "living", "staying", "home", "house", "address", 
            "born", "from", "born in", "stay at", "stay in", "call me", "name is",
            "reside", "apartment", "landmark", "work at", "office", "desk"
        }

    def redact_text(self, text: str, mode: str = "redact", config: Dict[str, Any] = None) -> tuple[str, list[dict]]:
        """
        Apply regex and NLP for redaction or synthetic swapping.
        Returns: (redacted_text, list_of_detailed_hits)
        
        Each hit now includes:
        - type: str (e.g., "email", "PERSON")
        - value: str (original matched text)
        - line_number: int (1-indexed)
        - context: dict with before/match/after lines
        """
        if not isinstance(text, str):
            return text, []
            
        hits = []
        # Default config if None
        if config is None:
            config = {}

        # Split text into lines for context extraction
        lines = text.split('\n')
        
        def extract_context(line_idx: int, match_text: str) -> dict:
            """Extract ±2 lines of context around a match"""
            return {
                "before": lines[max(0, line_idx-2):line_idx],
                "match": lines[line_idx] if line_idx < len(lines) else "",
                "after": lines[line_idx+1:min(len(lines), line_idx+3)]
            }
        
        def find_line_number(original_text: str, match_start: int) -> int:
            """Find line number (1-indexed) for a character position"""
            return original_text[:match_start].count('\n') + 1

        # Synthetic Data Maps (Simple deterministic list for demo)
        synthetic_map = {
            "PERSON": ["Alex", "Jordan", "Taylor", "Morgan", "Casey"],
            "ORG": ["Acme Corp", "Globex", "Initech", "Umbrella Corp", "Stark Ind"],
            "GPE": ["Springfield", "Gotham", "Metropolis", "Atlantis", "Wakanda"],
            "EMAIL": ["user@example.com", "contact@sample.org", "info@demo.net"],
            "PHONE": ["+1-555-0123", "555-0199", "555-0100"]
        }
        
        # Helper for swapping
        def get_swap(entity_type):
            options = synthetic_map.get(entity_type, ["DATA"])
            return options[len(text) % len(options)] 

        redacted_text = text
        
        # 0. Custom Keywords Redaction
        custom_keywords = config.get("custom_keywords", [])
        for keyword in custom_keywords:
            if keyword and keyword.lower() in redacted_text.lower():
                # Case insensitive replacement
                pattern = re.compile(re.escape(keyword), re.IGNORECASE)
                for match in pattern.finditer(text): # Use original 'text' for accurate line numbers
                    line_num = find_line_number(text, match.start())
                    hits.append({
                        "type": "CUSTOM_KEYWORD",
                        "value": match.group(),
                        "line_number": line_num,
                        "context": extract_context(line_num - 1, match.group())
                    })
                
                def replace_keyword(match):
                    if mode == "swap":
                        return "PROJECT_X" # Generic swap
                    return "[REDACTED]"
                redacted_text = pattern.sub(replace_keyword, redacted_text)

        # 1. Regex Redaction first
        for key, pattern in self.patterns.items():
            # Check config: e.g. redact_email, redact_phone
            # Default to True if config key missing
            if not config.get(f"redact_{key}", True):
                continue

            for match in pattern.finditer(text): # Use original 'text' for accurate line numbers
                line_num = find_line_number(text, match.start())
                hits.append({
                    "type": key,
                    "value": match.group(),
                    "line_number": line_num,
                    "context": extract_context(line_num - 1, match.group())
                })
            
            def replace_match(match):
                if mode == "swap":
                    return get_swap(key.upper())
                return f"[{key.upper()}_REDACTED]"
            
            redacted_text = pattern.sub(replace_match, redacted_text)
        
        # 2. NLP Redaction
        # Config check for NLP categories? key logic: redact_person, redact_org, redact_gpe
        if nlp:
            doc = nlp(redacted_text)
            for ent in reversed(doc.ents):
                # Map spaCy label to lower key
                label_key = ent.label_.lower() # person, org, gpe
                
                # Default behavior: Block all detected entities unless configured otherwise
                if not config.get(f"redact_{label_key}", True):
                     continue

                # Smart Contextual Redaction Logic
                start = ent.start_char
                prefix = redacted_text[max(0, start - 50):start].lower()
                is_personal = any(trigger in prefix for trigger in self.personal_triggers)
                
                # 1. Skip if it's a known public entity AND context is NOT personal
                if ent.text.lower() in self.public_whitelist and not is_personal:
                    continue 

                # 2. Skip GPE (Locations) if context is NOT personal
                if ent.label_ == "GPE" and not is_personal:
                    continue

                if ent.label_ in ["PERSON", "ORG", "GPE"]:
                    start = ent.start_char
                    end = ent.end_char
                    
                    line_num = find_line_number(redacted_text, start)
                    hits.append({
                        "type": ent.label_,
                        "value": ent.text,
                        "line_number": line_num,
                        "context": extract_context(line_num - 1, ent.text)
                    })
                    
                    if mode == "swap":
                        replacement = get_swap(ent.label_)
                    else:
                        replacement = f"[{ent.label_}_REDACTED]"
                        
                    redacted_text = redacted_text[:start] + replacement + redacted_text[end:]
        
        return redacted_text, hits

    def redact_json(self, data: Union[Dict, list, str], mode: str = "mask", config: Dict[str, Any] = None) -> tuple[Any, list[str]]:
        """Recursively traverse JSON and redact string values. Returns (redacted_data, all_hits)."""
        all_hits = []

        if isinstance(data, dict):
            new_dict = {}
            for k, v in data.items():
                r_val, hits = self.redact_json(v, mode, config)
                new_dict[k] = r_val
                all_hits.extend(hits)
            return new_dict, all_hits
            
        elif isinstance(data, list):
            new_list = []
            for item in data:
                r_val, hits = self.redact_json(item, mode, config)
                new_list.append(r_val)
                all_hits.extend(hits)
            return new_list, all_hits
            
        elif isinstance(data, str):
            val, hits = self.redact_text(data, mode, config)
            return val, hits
            
        else:
            return data, []

redactor = RedactionService()
