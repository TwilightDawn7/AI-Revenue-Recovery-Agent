import os
import base64
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/revenue_recovery"
    )
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    INNGEST_API_KEY: str = os.getenv("INNGEST_API_KEY", "")
    RAZORPAY_API_KEY: str = os.getenv("RAZORPAY_API_KEY", "")
    
    @property
    def _parsed_razorpay_str(self) -> str:
        raw = self.RAZORPAY_API_KEY.strip()
        if not raw:
            return ""
        # Check if base64 encoded
        if not (raw.startswith("rzp_") or ":" in raw):
            try:
                decoded = base64.b64decode(raw).decode("utf-8").strip()
                if "rzp_" in decoded or ":" in decoded:
                    return decoded
            except Exception:
                pass
        return raw

    @property
    def razorpay_key_id(self) -> str:
        parsed = self._parsed_razorpay_str
        if ":" in parsed:
            return parsed.split(":")[0]
        return parsed

    @property
    def razorpay_key_secret(self) -> str:
        parsed = self._parsed_razorpay_str
        if ":" in parsed:
            return parsed.split(":")[1]
        return ""

settings = Settings()
