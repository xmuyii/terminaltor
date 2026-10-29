import asyncio
from datetime import datetime, time, timedelta, timezone
import math
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from phase1.app.database import SEEDED_CHALLENGES
from phase2.app.database import (
    _FIRST_PASS_SET,
    _PROFILES,
    count_user_solves,
    get_profile,
    has_first_passed,
    update_profile_streak,
)
from phase3.app.data.challenges_phase3 import PHASE3_CHALLENGES
from phase3.app.database import _SUBMISSIONS, ALL_HAND_AUTHORED_CHALLENGES

_DB_LOCK = asyncio.Lock()

# Materialized view cache in memory
_MATERIALIZED_ALL_TIME_CACHE: Optional[List[Dict[str, Any]]] = None
_MATERIALIZED_REFRESHED_AT: Optional[datetime] = None


def get_utc_start_of_day(dt: Optional[datetime] = None) -> datetime:
    """Returns 00:00:00.000 UTC for the given date (default: today)."""
    now = dt or datetime.now(timezone.utc)
    return datetime.combine(now.date(), time.min, tzinfo=timezone.utc)


def get_utc_start_of_week(dt: Optional[datetime] = None) -> datetime:
    """Returns Monday 00:00:00.000 UTC for the given date's week."""
    now = dt or datetime.now(timezone.utc)
    start_of_day = get_utc_start_of_day(now)
    days_since_monday = now.weekday()  # Monday is 0
    return start_of_day - timedelta(days=days_since_monday)


def get_utc_start_of_month(dt: Optional[datetime] = None) -> datetime:
    """Returns 1st of month 00:00:00.000 UTC."""
    now = dt or datetime.now(timezone.utc)
    return datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)


def get_timeframe_cutoff(timeframe: str, now: Optional[datetime] = None) -> Optional[datetime]:
    """Returns cutoff timestamp for timeframe filtering."""
    if timeframe == "daily":
        return get_utc_start_of_day(now)
    elif timeframe == "weekly":
        return get_utc_start_of_week(now)
    elif timeframe == "monthly":
        return get_utc_start_of_month(now)
    elif timeframe == "all_time":
        return None
    else:
        raise ValueError(f"Invalid timeframe: {timeframe}. Must be 'daily', 'weekly', 'monthly', or 'all_time'.")


async def get_raw_leaderboard_for_timeframe(timeframe: str) -> List[Dict[str, Any]]:
    """Computes all ranked participants for the given timeframe.

    Deterministic tie-breaking:
      1. Points / XP DESC
      2. Last submission timestamp ASC (earlier is better)
      3. User ID ASC (guarantees strictly stable pagination with zero jitter)
    """
    cutoff = get_timeframe_cutoff(timeframe)

    if timeframe == "all_time":
        # Check materialized view cache if available
        global _MATERIALIZED_ALL_TIME_CACHE
        if _MATERIALIZED_ALL_TIME_CACHE is not None:
            return list(_MATERIALIZED_ALL_TIME_CACHE)

        # Aggregate all-time stats
        user_stats: Dict[UUID, Dict[str, Any]] = {}
        for p in _PROFILES.values():
            if p.get("total_xp", 0) > 0:
                user_stats[p["id"]] = {
                    "user_id": p["id"],
                    "username": p["username"],
                    "avatar_url": p.get("avatar_url"),
                    "points": p.get("total_xp", 0),
                    "challenges_solved": 0,
                    "last_submission_at": p.get("last_active_at") or p.get("created_at"),
                }

        # Calculate distinct solved challenges from submissions
        for s in _SUBMISSIONS:
            u_id = s["user_id"]
            if u_id in user_stats and s.get("passed"):
                # Track last submission
                sub_dt = s.get("created_at")
                curr_last = user_stats[u_id]["last_submission_at"]
                if sub_dt and (curr_last is None or sub_dt > curr_last):
                    user_stats[u_id]["last_submission_at"] = sub_dt

        # Count distinct solves per user
        for u_id in user_stats:
            user_stats[u_id]["challenges_solved"] = sum(
                1 for (u, c) in _FIRST_PASS_SET if u == u_id
            )

        ranked = list(user_stats.values())
    else:
        # Windowed aggregation across submissions within cutoff
        window_users: Dict[UUID, Dict[str, Any]] = {}
        distinct_solved: Dict[UUID, set] = {}

        for s in _SUBMISSIONS:
            s_time = s.get("created_at")
            if not s_time or (cutoff and s_time < cutoff):
                continue

            u_id = s["user_id"]
            xp = s.get("xp_awarded", 0)

            if u_id not in window_users:
                profile = await get_profile(u_id)
                window_users[u_id] = {
                    "user_id": u_id,
                    "username": profile.get("username", f"user_{str(u_id)[:8]}"),
                    "avatar_url": profile.get("avatar_url"),
                    "points": 0,
                    "challenges_solved": 0,
                    "last_submission_at": s_time,
                }
                distinct_solved[u_id] = set()

            window_users[u_id]["points"] += xp
            if s.get("passed"):
                distinct_solved[u_id].add(str(s.get("challenge_id")))

            curr_last = window_users[u_id]["last_submission_at"]
            if s_time > curr_last:
                window_users[u_id]["last_submission_at"] = s_time

        # Update challenges_solved
        for u_id, item in window_users.items():
            item["challenges_solved"] = len(distinct_solved.get(u_id, set()))

        # Filter only users with points > 0 in this window
        ranked = [u for u in window_users.values() if u["points"] > 0]

    # Deterministic sorting
    ranked.sort(
        key=lambda x: (
            -x["points"],
            x["last_submission_at"] or datetime.min.replace(tzinfo=timezone.utc),
            str(x["user_id"]),
        )
    )

    # Assign dense ranks
    dense_rank = 1
    for i, entry in enumerate(ranked):
        if i > 0:
            prev = ranked[i - 1]
            if entry["points"] != prev["points"]:
                dense_rank += 1
        entry["rank"] = dense_rank

    return ranked


async def get_leaderboard_page(
    timeframe: str,
    page: int = 1,
    page_size: int = 25,
) -> Tuple[int, int, List[Dict[str, Any]]]:
    """Returns (total_count, total_pages, paged_entries) for timeframe."""
    all_entries = await get_raw_leaderboard_for_timeframe(timeframe)
    total_count = len(all_entries)
    total_pages = max(1, math.ceil(total_count / page_size)) if total_count > 0 else 1

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_entries = all_entries[start_idx:end_idx]

    return total_count, total_pages, page_entries


async def get_user_rank_in_timeframe(
    user_id: UUID,
    timeframe: str,
) -> Optional[Dict[str, Any]]:
    """Returns the user's specific rank entry in the given timeframe."""
    all_entries = await get_raw_leaderboard_for_timeframe(timeframe)
    for entry in all_entries:
        if entry["user_id"] == user_id:
            return entry
    return None


async def refresh_materialized_view() -> int:
    """Simulates REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_all_time_mat."""
    global _MATERIALIZED_ALL_TIME_CACHE, _MATERIALIZED_REFRESHED_AT
    async with _DB_LOCK:
        # Re-compute without using cache
        _MATERIALIZED_ALL_TIME_CACHE = None
        computed = await get_raw_leaderboard_for_timeframe("all_time")
        _MATERIALIZED_ALL_TIME_CACHE = computed
        _MATERIALIZED_REFRESHED_AT = datetime.now(timezone.utc)
        return len(computed)


def seed_benchmark_submissions(num_users: int = 100, submissions_per_user: int = 5):
    """Utility to seed benchmark test data across daily, weekly, monthly, and all-time windows."""
    now = datetime.now(timezone.utc)
    for i in range(num_users):
        u_id = UUID(f"00000000-0000-0000-0001-{i:012d}")
        _PROFILES[u_id] = {
            "id": u_id,
            "username": f"student_{i:04d}",
            "avatar_url": None,
            "total_xp": 0,
            "current_streak": 1,
            "longest_streak": 1,
            "last_active_at": now,
            "created_at": now - timedelta(days=60),
        }
        total_xp = 0
        for s_idx in range(submissions_per_user):
            # Spread submissions across days: today, 3 days ago, 15 days ago, 45 days ago
            age_days = (s_idx * 12) % 40
            sub_time = now - timedelta(days=age_days, hours=s_idx)
            xp = 10 + (s_idx * 15)
            total_xp += xp
            cid = f"chal-{s_idx % 10}"
            _FIRST_PASS_SET.add((u_id, cid))
            _SUBMISSIONS.append({
                "id": uuid4(),
                "user_id": u_id,
                "challenge_id": cid,
                "code": "def solve(): pass",
                "passed": True,
                "execution_ms": 12,
                "stdout": "",
                "stderr": "",
                "results": [],
                "is_first_pass": True,
                "xp_awarded": xp,
                "created_at": sub_time,
            })
        _PROFILES[u_id]["total_xp"] = total_xp
