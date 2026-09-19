"""
Configuration module for RailWise AI Backend.
Loads environment variables and provides structured settings via Pydantic.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    """
    Application settings derived from environment variables.
    If required fields are missing from .env, Pydantic will automatically 
    raise meaningful ValidationErrors at startup.
    """
    api_title: str = "NexRail AI"
    api_version: str = "1.0"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS (comma-separated origins)
    cors_origins: str = "https://nexrail-admin-six.vercel.app,https://nexrail-passenger.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    
    # Auth Settings (Required from environment; no hardcoded secret fallback)
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440 # 24 hours
    
    # External API Keys (Required fields - no defaults)
    openweather_api_key: str
    railradar_api_key: str
    
    # External API Base URLs (With defaults)
    openweather_base_url: str = "https://api.openweathermap.org"
    railradar_base_url: str = "https://api.railradar.in"
    
    # Database Configuration (With default fallback)
    database_url: str = "sqlite:///./train_eta.db"
    
    # API Client Settings
    http_timeout: int = 10

    @property
    def parsed_cors_origins(self) -> list[str]:
        """
        Safely parses the comma-separated cors_origins string into a trimmed, non-empty list.
        """
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # Load from .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache()
def get_settings():
    """
    Returns a cached instance of the settings.
    lru_cache ensures the .env file is only parsed once and variables are loaded only once.
    """
    return Settings()

settings = get_settings()
