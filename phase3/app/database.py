import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

# Import Phase 1 challenges seed
from phase1.app.database import SEEDED_CHALLENGES
from phase2.app.database import (
    _PROFILES,
    _FIRST_PASS_SET,
    get_profile,
    update_profile_streak,
    count_user_solves,
    has_first_passed,
    get_leaderboard_all_time,
    get_user_rank,
)
from phase3.app.data.challenges_phase3 import PHASE3_CHALLENGES
from phase3.app.services.anti_cheat import check_submission_for_cheating, normalize_code_ast
from phase3.app.services.procedural import generate_challenge, get_daily_challenge_for_user

# Combine all hand-authored challenges (20 from Phase 1 + 40 from Phase 3 = 60 total)
ALL_HAND_AUTHORED_CHALLENGES = SEEDED_CHALLENGES + PHASE3_CHALLENGES

# Submissions storage with Phase 3 anti-cheat metadata
_SUBMISSIONS: List[Dict[str, Any]] = []

# Plagiarism flags audit table (for review via SQL / query)
_PLAGIARISM_FLAGS: List[Dict[str, Any]] = []

# Rate limits in-memory table
_RATE_LIMITS: Dict[str, Dict[str, Any]] = {}

_DB_LOCK = asyncio.Lock()


async def get_all_challenges(user_id: Optional[UUID] = None) -> List[Dict[str, Any]]:
    """Returns all hand-authored challenges across Tiers 1-8, plus daily procedural challenges for Tiers 9-10."""
    challenges = list(ALL_HAND_AUTHORED_CHALLENGES)
    if user_id:
        # Include procedural challenges for Tier 9 and Tier 10
        t9 = get_daily_challenge_for_user(str(user_id), tier=9)
        t10 = get_daily_challenge_for_user(str(user_id), tier=10)
        challenges.extend([t9, t10])
    return challenges


async def get_challenge_by_id(challenge_id: Any, user_id: Optional[UUID] = None) -> Optional[Dict[str, Any]]:
    """Retrieves challenge by UUID or procedural ID string (e.g. 'gen-9-12345')."""
    # Check if procedural challenge ID
    cid_str = str(challenge_id)
    if cid_str.startswith("gen-"):
        parts = cid_str.split("-")
        if len(parts) >= 3:
            tier = int(parts[1])
            seed = int(parts[2])
            return generate_challenge(seed=seed, tier=tier)

    # Check hand-authored challenges
    for c in ALL_HAND_AUTHORED_CHALLENGES:
        if str(c["id"]) == cid_str or str(c["slug"]) == cid_str:
            return c

    # Fallback to checking daily procedural for user if requested
    if user_id and ("tier-9" in cid_str or "tier9" in cid_str):
        return get_daily_challenge_for_user(str(user_id), tier=9)
    if user_id and ("tier-10" in cid_str or "tier10" in cid_str):
        return get_daily_challenge_for_user(str(user_id), tier=10)

    return None


async def count_user_submissions_for_challenge(user_id: UUID, challenge_id: Any) -> int:
    """Counts existing submissions by user for this challenge."""
    cid_str = str(challenge_id)
    return sum(
        1 for s in _SUBMISSIONS
        if s["user_id"] == user_id and str(s["challenge_id"]) == cid_str
    )


async def get_recent_ast_hashes_for_challenge(challenge_id: Any) -> List[Tuple[str, str]]:
    """Returns list of (user_id_str, ast_hash) for other submissions on this challenge."""
    cid_str = str(challenge_id)
    return [
        (str(s["user_id"]), s.get("ast_hash", ""))
        for s in _SUBMISSIONS
        if str(s["challenge_id"]) == cid_str and s.get("ast_hash")
    ]


async def record_submission_transaction(
    user_id: UUID,
    challenge_id: Any,
    code: str,
    passed: bool,
    execution_ms: int,
    stdout: str,
    stderr: str,
    results: List[Dict[str, Any]],
    xp_to_award: int,
) -> Tuple[UUID, bool, int, Dict[str, Any], Dict[str, Any]]:
    """Phase 3 Submission Transaction:
    - Normalizes AST & checks anti-cheat / plagiarism
    - Submissions 2-5 of duplicate code are flagged for review in DB but still scored normally
    - Records submission with ast_hash and plagiarism audit details
    - Atomically updates first pass, streak, and XP
    Returns:
      (submission_id, is_first_pass, awarded_xp, updated_profile, anti_cheat_result)
    """
    async with _DB_LOCK:
        submission_id = uuid4()
        cid_str = str(challenge_id)

        # 1. AST normalization and Anti-Cheat Evaluation
        prior_submission_count = await count_user_submissions_for_challenge(user_id, challenge_id)
        other_ast_hashes = await get_recent_ast_hashes_for_challenge(challenge_id)

        anti_cheat = check_submission_for_cheating(
            user_id=str(user_id),
            challenge_id=cid_str,
            code=code,
            user_submission_count_for_challenge=prior_submission_count,
            recent_ast_hashes_for_challenge=other_ast_hashes,
        )

        is_first_pass = False
        awarded_xp = 0

        # Unique constraint on first-pass XP
        pass_key = (user_id, cid_str)
        if passed and pass_key not in _FIRST_PASS_SET:
            is_first_pass = True
            _FIRST_PASS_SET.add(pass_key)
            awarded_xp = xp_to_award

        # 2. Record submission row with Phase 3 audit columns
        submission_record = {
            "id": submission_id,
            "user_id": user_id,
            "challenge_id": cid_str,
            "code": code,
            "passed": passed,
            "execution_ms": execution_ms,
            "stdout": stdout,
            "stderr": stderr,
            "results": results,
            "is_first_pass": is_first_pass,
            "xp_awarded": awarded_xp,
            "ast_hash": anti_cheat["ast_hash"],
            "is_plagiarized": anti_cheat["is_flagged"],
            "plagiarism_reason": anti_cheat["reason"] if anti_cheat["is_flagged"] else None,
            "similarity_score": anti_cheat["similarity_score"],
            "created_at": datetime.now(timezone.utc),
        }
        _SUBMISSIONS.append(submission_record)

        # 3. If flagged, persist audit entry in plagiarism_flags review table
        if anti_cheat["is_flagged"]:
            flag_record = {
                "id": uuid4(),
                "submission_id": submission_id,
                "user_id": user_id,
                "challenge_id": cid_str,
                "flag_type": anti_cheat["flag_type"],
                "similarity_score": anti_cheat["similarity_score"],
                "matched_submission_id": anti_cheat.get("matched_submission_id"),
                "details": {
                    "reason": anti_cheat["reason"],
                    "submission_number": prior_submission_count + 1,
                    "ast_hash": anti_cheat["ast_hash"],
                },
                "created_at": datetime.now(timezone.utc),
            }
            _PLAGIARISM_FLAGS.append(flag_record)

        # 4. Apply XP trigger to profile
        profile = await get_profile(user_id)
        if awarded_xp > 0:
            profile["total_xp"] = profile.get("total_xp", 0) + awarded_xp

        # 5. Update streak on first pass
        if is_first_pass:
            await update_profile_streak(user_id)

        return submission_id, is_first_pass, awarded_xp, profile, anti_cheat


async def get_all_plagiarism_flags() -> List[Dict[str, Any]]:
    """Returns all plagiarism flags for administrative / teacher review."""
    return _PLAGIARISM_FLAGS
