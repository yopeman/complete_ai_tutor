from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    
    # JWT
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    
    # App
    debug: bool
    
    # Groq
    groq_api_key: str
    
    @property
    def database_url(self) -> str:
        return f"mysql+aiomysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
