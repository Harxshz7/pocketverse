"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """PocketVerse application settings.

    All values can be overridden via environment variables or a .env file.
    """

    # Runtime
    ENVIRONMENT: str = "development"
    API_VERSION: str = "v1"
    APP_NAME: str = "StoryGuard"

    # OpenAI
    OPENAI_API_KEY: str = ""
    MODEL_NAME: str = "gpt-4.1-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./pocketverse.db"

    # Queue / cache
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Storage
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "storyguard-uploads"

    # Security
    JWT_SECRET_KEY: str = "dev-insecure-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    MAX_UPLOAD_BYTES: int = 50 * 1024 * 1024
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 120

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def is_production(self) -> bool:
        """Return true when production safety checks should be enforced."""
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
