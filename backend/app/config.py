from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str
    
    # JWT
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    
    # App
    debug: bool
    
    # Groq
    groq_api_key: str
    groq_thinking_model: str
    groq_generating_model: str

    # Base URL for frontend and backend
    frontend_base_url: str
    backend_base_url: str

    # Chapa
    chapa_api_key: str

    # Audio
    audio_cache_dir: str = "audio_cache"

    @property
    def chapa_callback_url(self) -> str:
        return f"{self.backend_base_url}/payments/callback"

    @property
    def chapa_return_url(self) -> str:
        return f"{self.frontend_base_url}/dashboard"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

@lru_cache()
def get_thinking_llm():
    from langchain_groq import ChatGroq
    settings = get_settings()
    return ChatGroq(
        model=settings.groq_thinking_model,
        temperature=0.7,
        groq_api_key=settings.groq_api_key
    )

@lru_cache()
def get_generating_llm():
    from langchain_groq import ChatGroq
    settings = get_settings()
    return ChatGroq(
        model=settings.groq_generating_model,
        temperature=0.7,
        groq_api_key=settings.groq_api_key
    )
