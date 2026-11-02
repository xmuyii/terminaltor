import os

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    def Field(*args, default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            try:
                return default_factory()
            except Exception:
                return None
        return default


class Settings(BaseModel):
    REDIS_URL: str = Field(default_factory=lambda: os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    LEADERBOARD_CACHE_TTL_DAILY: int = Field(
        default_factory=lambda: int(os.getenv("LEADERBOARD_CACHE_TTL_DAILY", "60"))
    )
    LEADERBOARD_CACHE_TTL_WEEKLY: int = Field(
        default_factory=lambda: int(os.getenv("LEADERBOARD_CACHE_TTL_WEEKLY", "300"))
    )
    LEADERBOARD_CACHE_TTL_MONTHLY: int = Field(
        default_factory=lambda: int(os.getenv("LEADERBOARD_CACHE_TTL_MONTHLY", "900"))
    )
    LEADERBOARD_CACHE_TTL_ALL_TIME: int = Field(
        default_factory=lambda: int(os.getenv("LEADERBOARD_CACHE_TTL_ALL_TIME", "3600"))
    )
    LEADERBOARD_PAGE_SIZE_DEFAULT: int = Field(
        default_factory=lambda: int(os.getenv("LEADERBOARD_PAGE_SIZE_DEFAULT", "25"))
    )
    LEADERBOARD_PAGE_SIZE_MAX: int = Field(
        default_factory=lambda: int(os.getenv("LEADERBOARD_PAGE_SIZE_MAX", "100"))
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not hasattr(self, "REDIS_URL") or self.REDIS_URL is None:
            self.REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        if not hasattr(self, "LEADERBOARD_CACHE_TTL_DAILY") or self.LEADERBOARD_CACHE_TTL_DAILY is None:
            self.LEADERBOARD_CACHE_TTL_DAILY = int(os.getenv("LEADERBOARD_CACHE_TTL_DAILY", "60"))
        if not hasattr(self, "LEADERBOARD_CACHE_TTL_WEEKLY") or self.LEADERBOARD_CACHE_TTL_WEEKLY is None:
            self.LEADERBOARD_CACHE_TTL_WEEKLY = int(os.getenv("LEADERBOARD_CACHE_TTL_WEEKLY", "300"))
        if not hasattr(self, "LEADERBOARD_CACHE_TTL_MONTHLY") or self.LEADERBOARD_CACHE_TTL_MONTHLY is None:
            self.LEADERBOARD_CACHE_TTL_MONTHLY = int(os.getenv("LEADERBOARD_CACHE_TTL_MONTHLY", "900"))
        if not hasattr(self, "LEADERBOARD_CACHE_TTL_ALL_TIME") or self.LEADERBOARD_CACHE_TTL_ALL_TIME is None:
            self.LEADERBOARD_CACHE_TTL_ALL_TIME = int(os.getenv("LEADERBOARD_CACHE_TTL_ALL_TIME", "3600"))
        if not hasattr(self, "LEADERBOARD_PAGE_SIZE_DEFAULT") or self.LEADERBOARD_PAGE_SIZE_DEFAULT is None:
            self.LEADERBOARD_PAGE_SIZE_DEFAULT = int(os.getenv("LEADERBOARD_PAGE_SIZE_DEFAULT", "25"))
        if not hasattr(self, "LEADERBOARD_PAGE_SIZE_MAX") or self.LEADERBOARD_PAGE_SIZE_MAX is None:
            self.LEADERBOARD_PAGE_SIZE_MAX = int(os.getenv("LEADERBOARD_PAGE_SIZE_MAX", "100"))


settings = Settings()
