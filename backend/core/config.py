import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "GenAI Recommender"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    # Database
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    postgres_server: str = os.getenv("POSTGRES_SERVER", "localhost")
    postgres_port: str = os.getenv("POSTGRES_PORT", "5432")
    postgres_db: str = os.getenv("POSTGRES_DB", "recommender_db")
    database_url: str = os.getenv("DATABASE_URL", "")

    # LLM Settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "google") # Default to Google now
    llm_model_name: str = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    embedding_model_name: str = os.getenv("EMBEDDING_MODEL_NAME", "models/text-embedding-004")
    
    # API Keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "") # New
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()