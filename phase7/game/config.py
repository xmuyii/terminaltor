"""Arcade Game Server Configuration."""
import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass
class GameSettings:
    # Network & Core Service
    GAME_HOST: str = os.getenv("GAME_HOST", "0.0.0.0")
    GAME_PORT: int = int(os.getenv("GAME_PORT", "8001"))
    GAME_PUBLIC_WS_URL: str = os.getenv("GAME_PUBLIC_WS_URL", "ws://localhost:8001/ws")
    GAME_INTERMISSION_SECONDS: int = int(os.getenv("GAME_INTERMISSION_SECONDS", "30"))
    GAME_MAX_PLAYERS_PER_ROOM: int = int(os.getenv("GAME_MAX_PLAYERS_PER_ROOM", "8"))
    GAME_MAX_ROOMS: int = int(os.getenv("GAME_MAX_ROOMS", "50"))
    GAME_ROOM_DORMANT_GRACE_SECONDS: int = int(os.getenv("GAME_ROOM_DORMANT_GRACE_SECONDS", "60"))
    GAME_JWT_SECRET: str = os.getenv("GAME_JWT_SECRET", "sovereign_dev_secret_key_change_in_prod")
    
    # Redis for cross-worker pub/sub & registry
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/sovereign_lms",
    )

    # Word Forge Configuration
    WORDFORGE_ROUND_SECONDS: int = int(os.getenv("WORDFORGE_ROUND_SECONDS", "180"))
    WORDFORGE_MIDROUND_AT_SECONDS: int = int(os.getenv("WORDFORGE_MIDROUND_AT_SECONDS", "90"))
    WORDFORGE_SEED_WORD_COUNT: int = int(os.getenv("WORDFORGE_SEED_WORD_COUNT", "2"))
    WORDFORGE_SEED_WORD_LENGTH: int = int(os.getenv("WORDFORGE_SEED_WORD_LENGTH", "6"))
    WORDFORGE_MIDROUND_LETTERS: int = int(os.getenv("WORDFORGE_MIDROUND_LETTERS", "2"))
    WORDFORGE_MIN_DISTINCT_LETTERS: int = int(os.getenv("WORDFORGE_MIN_DISTINCT_LETTERS", "15"))
    WORDFORGE_SUBMIT_RATE_LIMIT_MS: int = int(os.getenv("WORDFORGE_SUBMIT_RATE_LIMIT_MS", "400"))
    WORDFORGE_FEED_BATCH_SIZE: int = int(os.getenv("WORDFORGE_FEED_BATCH_SIZE", "4"))
    WORDFORGE_FEED_BATCH_INTERVAL_MS: int = int(os.getenv("WORDFORGE_FEED_BATCH_INTERVAL_MS", "15000"))
    WORDFORGE_FEED_VISIBLE_BATCHES: int = int(os.getenv("WORDFORGE_FEED_VISIBLE_BATCHES", "4"))
    WORDFORGE_ENGLISH_STREAK_MAX: int = int(os.getenv("WORDFORGE_ENGLISH_STREAK_MAX", "3"))

    # Debugs Hunting Configuration
    DEBUGSHUNTING_QUESTIONS_PER_ROUND: int = int(os.getenv("DEBUGSHUNTING_QUESTIONS_PER_ROUND", "10"))
    DEBUGSHUNTING_QUESTION_SECONDS: int = int(os.getenv("DEBUGSHUNTING_QUESTION_SECONDS", "10"))
    DEBUGSHUNTING_REVEAL_PAUSE_MS: int = int(os.getenv("DEBUGSHUNTING_REVEAL_PAUSE_MS", "1500"))


@lru_cache()
def get_game_settings() -> GameSettings:
    return GameSettings()


game_settings = get_game_settings()
