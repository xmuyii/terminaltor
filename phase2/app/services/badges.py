import logging
from typing import List
from uuid import UUID

logger = logging.getLogger("gamification.badges")

# Canonical badges definitions
SEED_BADGES = [
    {"id": "first_steps", "name": "First Steps", "kind": "solves", "threshold": 1},
    {"id": "getting_going", "name": "Getting Going", "kind": "solves", "threshold": 5},
    {"id": "problem_solver", "name": "Problem Solver", "kind": "solves", "threshold": 15},
    {"id": "century", "name": "Century", "kind": "xp", "threshold": 100},
    {"id": "five_hundred", "name": "High Five", "kind": "xp", "threshold": 500},
    {"id": "two_thousand", "name": "Scholar", "kind": "xp", "threshold": 2000},
    {"id": "ten_thousand", "name": "Master", "kind": "xp", "threshold": 10000},
    {"id": "three_day", "name": "On a Roll", "kind": "streak", "threshold": 3},
    {"id": "seven_day", "name": "Week Warrior", "kind": "streak", "threshold": 7},
    {"id": "thirty_day", "name": "Unstoppable", "kind": "streak", "threshold": 30},
]

# In-memory store for user badges
_USER_BADGES_STORE: dict[UUID, set[str]] = {}


async def evaluate_badges(
    user_id: UUID,
    total_xp: int,
    current_streak: int,
    solves_count: int,
    db: any = None,
) -> List[str]:
    """Reads user's metrics, compares against badges table, and awards new badges idempotently.

    Returns the list of newly-unlocked badge IDs.
    """
    if user_id not in _USER_BADGES_STORE:
        _USER_BADGES_STORE[user_id] = set()

    already_unlocked = _USER_BADGES_STORE[user_id]
    newly_unlocked: List[str] = []

    for badge in SEED_BADGES:
        bid = badge["id"]
        if bid in already_unlocked:
            continue

        kind = badge["kind"]
        thresh = badge["threshold"]
        qualified = False

        if kind == "solves" and solves_count >= thresh:
            qualified = True
        elif kind == "xp" and total_xp >= thresh:
            qualified = True
        elif kind == "streak" and current_streak >= thresh:
            qualified = True

        if qualified:
            already_unlocked.add(bid)
            newly_unlocked.append(bid)
            logger.info("Badge unlocked for user %s: %s", user_id, bid)

    return newly_unlocked


def get_user_badges_list(user_id: UUID) -> List[str]:
    return list(_USER_BADGES_STORE.get(user_id, set()))
