import os
from functools import lru_cache
from typing import Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    try:
        from pydantic import BaseModel as BaseSettings
        SettingsConfigDict = dict
    except ImportError:
        class BaseSettings:
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        SettingsConfigDict = dict


class Settings(BaseSettings):
    # App & Server Settings
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")
    MAX_CODE_SIZE_BYTES: int = int(os.getenv("MAX_CODE_SIZE_BYTES", "65536"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "anon-key-placeholder")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-placeholder")

    # Redis Cache & Queue
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_QUEUE_URL: str = os.getenv("REDIS_QUEUE_URL", "redis://localhost:6379/1")
    QUEUE_MAX_JOBS: int = int(os.getenv("QUEUE_MAX_JOBS", "50"))
    QUEUE_JOB_TIMEOUT_SECONDS: int = int(os.getenv("QUEUE_JOB_TIMEOUT_SECONDS", "15"))
    QUEUE_RESULT_TTL_SECONDS: int = int(os.getenv("QUEUE_RESULT_TTL_SECONDS", "300"))
    WORKER_CONCURRENCY: int = int(os.getenv("WORKER_CONCURRENCY", "4"))

    # Sandbox Isolation Settings
    SANDBOX_BACKEND: str = os.getenv("SANDBOX_BACKEND", "subprocess")  # docker | subprocess
    SANDBOX_IMAGE: str = os.getenv("SANDBOX_IMAGE", "lms-sandbox:latest")
    SANDBOX_TIMEOUT_SECONDS: int = int(os.getenv("SANDBOX_TIMEOUT_SECONDS", "8"))
    SANDBOX_MEMORY_LIMIT_MB: int = int(os.getenv("SANDBOX_MEMORY_LIMIT_MB", "128"))
    SANDBOX_CPU_QUOTA: int = int(os.getenv("SANDBOX_CPU_QUOTA", "50000"))
    SANDBOX_PIDS_LIMIT: int = int(os.getenv("SANDBOX_PIDS_LIMIT", "64"))
    SANDBOX_NETWORK: str = os.getenv("SANDBOX_NETWORK", "none")
    SANDBOX_POOL_SIZE: int = int(os.getenv("SANDBOX_POOL_SIZE", "8"))

    # Observability Settings
    METRICS_ENABLED: bool = os.getenv("METRICS_ENABLED", "true").lower() in ("true", "1", "yes")
    METRICS_PATH: str = os.getenv("METRICS_PATH", "/metrics")
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN", None)
    TRACE_SAMPLE_RATE: float = float(os.getenv("TRACE_SAMPLE_RATE", "0.1"))

    # Leaderboard Cache TTLs (Phase 4)
    LEADERBOARD_CACHE_TTL_DAILY: int = int(os.getenv("LEADERBOARD_CACHE_TTL_DAILY", "60"))
    LEADERBOARD_CACHE_TTL_WEEKLY: int = int(os.getenv("LEADERBOARD_CACHE_TTL_WEEKLY", "300"))
    LEADERBOARD_CACHE_TTL_MONTHLY: int = int(os.getenv("LEADERBOARD_CACHE_TTL_MONTHLY", "900"))
    LEADERBOARD_CACHE_TTL_ALL_TIME: int = int(os.getenv("LEADERBOARD_CACHE_TTL_ALL_TIME", "3600"))
    LEADERBOARD_PAGE_SIZE_DEFAULT: int = int(os.getenv("LEADERBOARD_PAGE_SIZE_DEFAULT", "25"))
    LEADERBOARD_PAGE_SIZE_MAX: int = int(os.getenv("LEADERBOARD_PAGE_SIZE_MAX", "100"))


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
