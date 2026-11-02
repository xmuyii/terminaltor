"""Persistence service for Arcade rounds, leaderboards, and XP."""
import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from phase7.game.config import game_settings

_asyncpg_available = False
try:
    import asyncpg
    _asyncpg_available = True
except ImportError:
    pass


class PersistenceManager:
    def __init__(self) -> None:
        self.in_memory_rounds: List[Dict[str, Any]] = []
        self.in_memory_players: List[Dict[str, Any]] = []
        self._pool: Optional[Any] = None

    async def get_pool(self) -> Optional[Any]:
        if not _asyncpg_available:
            return None
        if self._pool is None:
            try:
                # Parse asyncpg DSN
                dsn = game_settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
                self._pool = await asyncpg.create_pool(dsn, min_size=1, max_size=5, timeout=5.0)
            except Exception:
                self._pool = None
        return self._pool

    async def save_round(
        self,
        mode: str,
        room_code: str,
        language: str,
        metadata: Dict[str, Any],
        started_at: float,
        ended_at: float,
        player_results: List[Dict[str, Any]],
    ) -> str:
        round_id = str(uuid.uuid4())
        started_dt = datetime.fromtimestamp(started_at, tz=timezone.utc)
        ended_dt = datetime.fromtimestamp(ended_at, tz=timezone.utc)
        player_count = len(player_results)

        # In-memory record
        round_record = {
            "id": round_id,
            "mode": mode,
            "room_code": room_code,
            "language": language,
            "metadata": metadata,
            "started_at": started_dt.isoformat(),
            "ended_at": ended_dt.isoformat(),
            "player_count": player_count,
            "players": player_results,
        }
        self.in_memory_rounds.append(round_record)

        # Persist to database if pool is active
        pool = await self.get_pool()
        if pool:
            try:
                async with pool.acquire() as conn:
                    async with conn.transaction():
                        # 1. Insert into game_rounds
                        await conn.execute(
                            """
                            INSERT INTO public.game_rounds
                              (id, mode, room_code, language, metadata, started_at, ended_at, player_count)
                            VALUES
                              ($1, $2, $3, $4, $5, $6, $7, $8)
                            """,
                            uuid.UUID(round_id),
                            mode,
                            room_code,
                            language,
                            json.dumps(metadata),
                            started_dt,
                            ended_dt,
                            player_count,
                        )

                        # 2. Insert into game_round_players and update profile XP
                        for p in player_results:
                            user_id_str = p.get("user_id")
                            score = p.get("score", 0)
                            detail = p.get("detail", {})
                            duration_ms = p.get("duration_ms", int((ended_at - started_at) * 1000))

                            try:
                                user_uuid = uuid.UUID(user_id_str)
                            except (ValueError, TypeError):
                                continue

                            await conn.execute(
                                """
                                INSERT INTO public.game_round_players
                                  (round_id, user_id, score, detail, duration_ms, submitted_at)
                                VALUES
                                  ($1, $2, $3, $4, $5, now())
                                ON CONFLICT (round_id, user_id) DO NOTHING
                                """,
                                uuid.UUID(round_id),
                                user_uuid,
                                score,
                                json.dumps(detail),
                                duration_ms,
                            )

                            # Award arcade XP to player profile (10% of game score as XP)
                            xp_awarded = max(5, int(score * 0.1))
                            await conn.execute(
                                """
                                UPDATE public.profiles
                                SET total_xp = total_xp + $1,
                                    updated_at = now()
                                WHERE id = $2
                                """,
                                xp_awarded,
                                user_uuid,
                            )
            except Exception as e:
                # DB error must not crash the arcade game loop
                pass

        return round_id


persistence = PersistenceManager()
