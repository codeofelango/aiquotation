import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "Project Phoenix"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    # Database
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    postgres_server: str = os.getenv("POSTGRES_SERVER", "localhost")
    postgres_port: str = os.getenv("POSTGRES_PORT", "5432")
    postgres_db: str = os.getenv("POSTGRES_DB", "recommender_db")
    database_url: str = os.getenv("DATABASE_URL", "")

    # AI Settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "google")
    llm_model_name: str = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    embedding_model_name: str = os.getenv("EMBEDDING_MODEL_NAME", "models/text-embedding-004")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")

    # Email Settings (SMTP)
    mail_username: str = os.getenv("MAIL_USERNAME", "apikey")
    mail_password: str = os.getenv("MAIL_PASSWORD", "")
    mail_from: str = os.getenv("MAIL_FROM", "noreply@projectphoenix.ai")
    mail_port: int = int(os.getenv("MAIL_PORT", 587))
    mail_server: str = os.getenv("MAIL_SERVER", "smtp.sendgrid.net")
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()