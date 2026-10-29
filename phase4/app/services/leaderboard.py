from typing import Any, Dict, List, Optional
from uuid import UUID

from phase4.app.config import settings
from phase4.app.database import (
    get_leaderboard_page,
    get_user_rank_in_timeframe,
    refresh_materialized_view,
)
from phase4.app.models.schemas import (
    LeaderboardEntry,
    LeaderboardResponse,
    LeaderboardTimeframe,
    UserRankResponse,
)
from phase4.app.services.cache import cache

# TTL mapping in seconds based on system prompt specification
TIMEFRAME_TTLS: Dict[str, int] = {
    "daily": settings.LEADERBOARD_CACHE_TTL_DAILY,       # 60 seconds
    "weekly": settings.LEADERBOARD_CACHE_TTL_WEEKLY,     # 300 seconds (5 min)
    "monthly": settings.LEADERBOARD_CACHE_TTL_MONTHLY,   # 900 seconds (15 min)
    "all_time": settings.LEADERBOARD_CACHE_TTL_ALL_TIME, # 3600 seconds (1 hour)
}


def get_cache_key(timeframe: str, page: int, page_size: int) -> str:
    """Standardizes cache keys for paginated leaderboard responses."""
    return f"leaderboard:{timeframe}:p{page}:s{page_size}"


async def get_leaderboard(
    timeframe: str,
    page: int = 1,
    page_size: int = settings.LEADERBOARD_PAGE_SIZE_DEFAULT,
    user_id: Optional[UUID] = None,
    force_refresh: bool = False,
) -> LeaderboardResponse:
    """Retrieves paginated multi-timeframe leaderboard with Redis caching and sub-100ms response time.

    Timeframe must be one of: 'daily', 'weekly', 'monthly', 'all_time'.
    """
    if timeframe not in TIMEFRAME_TTLS:
        raise ValueError(f"Unsupported timeframe '{timeframe}'. Must be one of {list(TIMEFRAME_TTLS.keys())}")

    # Bound page size to safe limits
    page_size = max(1, min(page_size, settings.LEADERBOARD_PAGE_SIZE_MAX))
    page = max(1, page)

    cache_key = get_cache_key(timeframe, page, page_size)
    ttl = TIMEFRAME_TTLS[timeframe]

    cached_data = None if force_refresh else await cache.get(cache_key)
    was_cached = False

    if cached_data is not None and isinstance(cached_data, dict):
        total = cached_data.get("total", 0)
        total_pages = cached_data.get("total_pages", 1)
        raw_entries = cached_data.get("entries", [])
        was_cached = True
    else:
        # Cache miss: compute from database layer
        total, total_pages, raw_entries = await get_leaderboard_page(
            timeframe=timeframe,
            page=page,
            page_size=page_size,
        )
        # Store in cache with specified TTL
        payload_to_cache = {
            "total": total,
            "total_pages": total_pages,
            "entries": raw_entries,
        }
        await cache.set(cache_key, payload_to_cache, ex=ttl)

    # Convert raw entries into Pydantic models
    entries = [
        LeaderboardEntry(
            rank=e["rank"],
            user_id=UUID(str(e["user_id"])),
            username=e["username"],
            avatar_url=e.get("avatar_url"),
            points=e["points"],
            challenges_solved=e["challenges_solved"],
            last_submission_at=e.get("last_submission_at"),
        )
        for e in raw_entries
    ]

    # Resolve requesting user's rank if user_id is provided
    my_rank = None
    if user_id:
        user_rank_info = await get_user_rank_in_timeframe(user_id, timeframe)
        if user_rank_info:
            my_rank = user_rank_info["rank"]

    return LeaderboardResponse(
        timeframe=timeframe,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        cached=was_cached,
        my_rank=my_rank,
        entries=entries,
    )


async def get_user_timeframe_stats(
    user_id: UUID,
    timeframe: str,
) -> UserRankResponse:
    """Returns standalone rank and metrics for a specific user within the chosen timeframe."""
    if timeframe not in TIMEFRAME_TTLS:
        raise ValueError(f"Unsupported timeframe '{timeframe}'. Must be one of {list(TIMEFRAME_TTLS.keys())}")

    user_info = await get_user_rank_in_timeframe(user_id, timeframe)
    # Count total users in this timeframe
    from phase4.app.database import get_raw_leaderboard_for_timeframe
    all_users = await get_raw_leaderboard_for_timeframe(timeframe)

    if user_info:
        return UserRankResponse(
            user_id=user_id,
            timeframe=timeframe,
            rank=user_info["rank"],
            points=user_info["points"],
            challenges_solved=user_info["challenges_solved"],
            total_participants=len(all_users),
        )

    return UserRankResponse(
        user_id=user_id,
        timeframe=timeframe,
        rank=None,
        points=0,
        challenges_solved=0,
        total_participants=len(all_users),
    )


async def invalidate_timeframe_cache(timeframe: str) -> int:
    """Invalidates cached entries for a given timeframe."""
    prefix = f"leaderboard:{timeframe}:"
    return await cache.clear_prefix(prefix)


async def invalidate_all_leaderboard_caches() -> int:
    """Invalidates all cached leaderboard pages."""
    return await cache.clear_prefix("leaderboard:")
