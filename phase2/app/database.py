import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

# Import Phase 1 challenges seed
from phase1.app.database import SEEDED_CHALLENGES

# Profiles in-memory store
_PROFILES: Dict[UUID, Dict[str, Any]] = {
    UUID("00000000-0000-0000-0000-000000000001"): {
        "id": UUID("00000000-0000-0000-0000-000000000001"),
        "username": "kid_coder",
        "avatar_url": None,
        "total_xp": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "last_active_at": None,
        "created_at": datetime.now(timezone.utc),
    }
}

# Submissions in-memory store
_SUBMISSIONS: List[Dict[str, Any]] = []

# First pass tracker set: (user_id, challenge_id)
_FIRST_PASS_SET: set[tuple[UUID, UUID]] = set()

# Lock for race condition safety during first pass determination
_DB_LOCK = asyncio.Lock()


async def get_all_challenges() -> List[Dict[str, Any]]:
    return SEEDED_CHALLENGES


async def get_challenge_by_id(challenge_id: UUID) -> Optional[Dict[str, Any]]:
    for c in SEEDED_CHALLENGES:
        if c["id"] == challenge_id:
            return c
    return None


async def get_profile(user_id: UUID) -> Dict[str, Any]:
    if user_id not in _PROFILES:
        _PROFILES[user_id] = {
            "id": user_id,
            "username": f"user_{str(user_id)[:8]}",
            "avatar_url": None,
            "total_xp": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "last_active_at": None,
            "created_at": datetime.now(timezone.utc),
        }
    return _PROFILES[user_id]


async def has_first_passed(user_id: UUID, challenge_id: UUID) -> bool:
    return (user_id, challenge_id) in _FIRST_PASS_SET


async def count_user_solves(user_id: UUID) -> int:
    return sum(1 for (u, c) in _FIRST_PASS_SET if u == user_id)


async def update_profile_streak(user_id: UUID) -> Dict[str, Any]:
    """Updates student streak using calendar day logic."""
    profile = await get_profile(user_id)
    last_dt: Optional[datetime] = profile.get("last_active_at")
    now_dt = datetime.now(timezone.utc)

    current_streak = profile.get("current_streak", 0)

    if last_dt is None:
        current_streak = 1
    else:
        # Day delta
        delta_days = (now_dt.date() - last_dt.date()).days
        if delta_days == 1:
            current_streak += 1
        elif delta_days > 1:
            current_streak = 1
        # if delta_days == 0, unchanged

    profile["current_streak"] = current_streak
    profile["longest_streak"] = max(profile.get("longest_streak", 0), current_streak)
    profile["last_active_at"] = now_dt
    profile["updated_at"] = now_dt

    return profile


async def record_submission_transaction(
    user_id: UUID,
    challenge_id: UUID,
    code: str,
    passed: bool,
    execution_ms: int,
    stdout: str,
    stderr: str,
    results: List[Dict[str, Any]],
    xp_to_award: int,
) -> tuple[UUID, bool, int, Dict[str, Any]]:
    """Executes atomic submission persistence, first-pass deduction, XP award, and streak update.

    Returns:
      (submission_id, is_first_pass, awarded_xp, updated_profile)
    """
    async with _DB_LOCK:
        submission_id = uuid4()
        is_first_pass = False
        awarded_xp = 0

        # Check unique constraint on first pass
        if passed and (user_id, challenge_id) not in _FIRST_PASS_SET:
            is_first_pass = True
            _FIRST_PASS_SET.add((user_id, challenge_id))
            awarded_xp = xp_to_award

        # Record submission row
        rec = {
            "id": submission_id,
            "user_id": user_id,
            "challenge_id": challenge_id,
            "code": code,
            "passed": passed,
            "execution_ms": execution_ms,
            "stdout": stdout,
            "stderr": stderr,
            "results": results,
            "is_first_pass": is_first_pass,
            "xp_awarded": awarded_xp,
            "created_at": datetime.now(timezone.utc),
        }
        _SUBMISSIONS.append(rec)

        # Apply XP trigger to profile
        profile = await get_profile(user_id)
        if awarded_xp > 0:
            profile["total_xp"] = profile.get("total_xp", 0) + awarded_xp

        # Update streak on first pass
        if is_first_pass:
            await update_profile_streak(user_id)

        return submission_id, is_first_pass, awarded_xp, profile


async def get_leaderboard_all_time(page: int = 1, page_size: int = 25) -> tuple[int, List[Dict[str, Any]]]:
    """Queries all profiles with total_xp > 0, ordered by XP desc, last_active_at asc."""
    active_profiles = [p for p in _PROFILES.values() if p.get("total_xp", 0) > 0]

    # Sort
    active_profiles.sort(
        key=lambda x: (-x.get("total_xp", 0), x.get("last_active_at") or datetime.min)
    )

    total = len(active_profiles)
    start = (page - 1) * page_size
    end = start + page_size
    sliced = active_profiles[start:end]

    entries = []
    for idx, p in enumerate(sliced):
        rank = start + idx + 1
        u_id = p["id"]
        solved_count = sum(1 for (u, c) in _FIRST_PASS_SET if u == u_id)
        entries.append({
            "rank": rank,
            "user_id": u_id,
            "username": p["username"],
            "avatar_url": p.get("avatar_url"),
            "points": p.get("total_xp", 0),
            "challenges_solved": solved_count,
            "last_submission_at": p.get("last_active_at"),
        })

    return total, entries


async def get_user_rank(user_id: UUID) -> Optional[int]:
    active_profiles = [p for p in _PROFILES.values() if p.get("total_xp", 0) > 0]
    active_profiles.sort(
        key=lambda x: (-x.get("total_xp", 0), x.get("last_active_at") or datetime.min)
    )
    for idx, p in enumerate(active_profiles):
        if p["id"] == user_id:
            return idx + 1
    return None
