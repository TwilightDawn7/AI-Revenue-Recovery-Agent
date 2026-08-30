import os
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
    def razorpay_key_id(self) -> str:
        if ":" in self.RAZORPAY_API_KEY:
            return self.RAZORPAY_API_KEY.split(":")[0]
        return self.RAZORPAY_API_KEY

    @property
    def razorpay_key_secret(self) -> str:
        if ":" in self.RAZORPAY_API_KEY:
            return self.RAZORPAY_API_KEY.split(":")[1]
        return ""

settings = Settings()
