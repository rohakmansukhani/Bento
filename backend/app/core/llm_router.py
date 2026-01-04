
import os
from google import genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class LLMRouter:
    def __init__(self):
        # Initialize Gemini with new SDK
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.model_name = "gemini-3-flash-preview"
        
        if self.gemini_key:
            self.client = genai.Client(api_key=self.gemini_key)
        else:
            print("Warning: GEMINI_API_KEY not found. LLM Router will fail for Gemini calls.")
            self.client = None

    async def route_request(self, provider: str, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """
        Routes the prompt to the specified LLM provider.
        Returns a dict: {"text": str, "usage": int}
        """
        if provider.lower() == "gemini":
            return await self._call_gemini(prompt, system_instruction)
        else:
            # Fallback for mock/other providers
            return {"text": f"Mock response from {provider}", "usage": len(prompt) // 4}

    async def _call_gemini(self, prompt: str, system_instruction: Optional[str]) -> Dict[str, Any]:
        if not self.client:
             return {"text": "Error: Gemini API Key missing.", "usage": 0}
        
        try:
            full_prompt = prompt
            if system_instruction:
                full_prompt = f"System Instruction: {system_instruction}\n\nUser Request: {prompt}"

            # The new SDK is synchronous by default, wrapping in simple execution for now if async needed
            # But FastAPI async def functions can run sync code (though it blocks). 
            # Ideally we'd use run_in_executor, but for simplicity/stability with this new SDK:
            response = self.client.models.generate_content(
                model=self.model_name, 
                contents=full_prompt
            )
            
            usage = 0
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                 usage = response.usage_metadata.total_token_count
            else:
                 usage = len(full_prompt) // 4

            return {"text": response.text, "usage": usage}
        except Exception as e:
            print(f"Gemini Call Failed: {e}")
            return {"text": f"Error processing with Gemini: {str(e)}", "usage": 0}

llm_router = LLMRouter()
