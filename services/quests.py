"""
Phase 9A — Retention Mechanics: Daily Quests Service
Deterministic 3 rotating quests per student seeded by (user_id, date) at midnight Africa/Lagos.
Easy (+30 XP), Medium (+80 XP), Stretch (+200 XP).
Checked at submission time; inline completion reward.
"""

import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

# Lagos timezone is UTC+1
LAGOS_TZ = timezone(timedelta(hours=1))

def get_lagos_date_str(dt: Optional[datetime] = None) -> str:
    if dt is None:
        dt = datetime.now(timezone.utc)
    lagos_dt = dt.astimezone(LAGOS_TZ)
    return lagos_dt.strftime("%Y-%m-%d")

# Template Pools
EASY_TEMPLATES = [
    {
        "template_id": "solve_tier_3",
        "title": "Solve 1 Tier 3+ challenge",
        "description": "Complete any algorithm challenge at Tier 3 or higher.",
        "reward_xp": 30,
        "tier_category": "easy",
        "target_count": 1,
        "criteria_type": "solve_tier",
        "min_tier": 3,
    },
    {
        "template_id": "solve_2_challenges",
        "title": "Solve 2 challenges",
        "description": "Write clean passing code for 2 coding exercises.",
        "reward_xp": 30,
        "tier_category": "easy",
        "target_count": 2,
        "criteria_type": "solve_count",
    },
    {
        "template_id": "clean_code_run",
        "title": "Zero-error first submission",
        "description": "Pass all unit tests on your initial test run.",
        "reward_xp": 30,
        "tier_category": "easy",
        "target_count": 1,
        "criteria_type": "zero_error",
    },
]

MEDIUM_TEMPLATES = [
    {
        "template_id": "earn_100_xp",
        "title": "Earn 100 XP today",
        "description": "Accumulate 100 XP across quests and challenges today.",
        "reward_xp": 80,
        "tier_category": "medium",
        "target_count": 100,
        "criteria_type": "earn_xp",
    },
    {
        "template_id": "solve_tier_5",
        "title": "Solve 1 Tier 5+ challenge",
        "description": "Tackle an advanced data structures challenge at Tier 5 or above.",
        "reward_xp": 80,
        "tier_category": "medium",
        "target_count": 1,
        "criteria_type": "solve_tier",
        "min_tier": 5,
    },
    {
        "template_id": "solve_3_consecutive",
        "title": "3 passing solutions streak",
        "description": "Solve 3 challenges without failing tests.",
        "reward_xp": 80,
        "tier_category": "medium",
        "target_count": 3,
        "criteria_type": "consecutive_solves",
    },
]

STRETCH_TEMPLATES = [
    {
        "template_id": "win_multiplayer_round",
        "title": "Win a multiplayer round",
        "description": "Claim 1st place in either Word Forge or Debugs Hunting.",
        "reward_xp": 200,
        "tier_category": "stretch",
        "target_count": 1,
        "criteria_type": "win_arcade",
    },
    {
        "template_id": "earn_250_xp",
        "title": "Earn 250 XP in one session",
        "description": "Reach a 250 XP total gain today through dedicated coding.",
        "reward_xp": 200,
        "tier_category": "stretch",
        "target_count": 250,
        "criteria_type": "earn_xp",
    },
    {
        "template_id": "solve_tier_7",
        "title": "Master a Tier 7+ challenge",
        "description": "Conquer a master-level algorithmic quest at Tier 7 or above.",
        "reward_xp": 200,
        "tier_category": "stretch",
        "target_count": 1,
        "criteria_type": "solve_tier",
        "min_tier": 7,
    },
]

def _deterministic_choice(seed_str: str, items: List[Any]) -> Any:
    """Deterministic selection based on SHA-256 hash modulo list length."""
    h = int(hashlib.sha256(seed_str.encode("utf-8")).hexdigest(), 16)
    return items[h % len(items)]

class DailyQuestsService:
    def __init__(self):
        # In-memory storage: (user_id, date_str, quest_index) -> quest_data
        self.quests_db: Dict[str, Dict[str, Any]] = {}

    def get_or_generate_quests(self, user_id: str, date_str: Optional[str] = None) -> List[Dict[str, Any]]:
        if not date_str:
            date_str = get_lagos_date_str()

        quests = []
        for idx, (pool, label) in enumerate([
            (EASY_TEMPLATES, "easy"),
            (MEDIUM_TEMPLATES, "medium"),
            (STRETCH_TEMPLATES, "stretch")
        ]):
            key = f"{user_id}:{date_str}:{idx}"
            if key in self.quests_db:
                quests.append(self.quests_db[key])
            else:
                seed = f"{user_id}:{date_str}:{idx}:{label}"
                tpl = _deterministic_choice(seed, pool)
                quest_record = {
                    "user_id": user_id,
                    "quest_date": date_str,
                    "quest_index": idx,
                    "template_id": tpl["template_id"],
                    "title": tpl["title"],
                    "description": tpl["description"],
                    "reward_xp": tpl["reward_xp"],
                    "tier_category": tpl["tier_category"],
                    "criteria_type": tpl["criteria_type"],
                    "min_tier": tpl.get("min_tier"),
                    "target_count": tpl["target_count"],
                    "current_count": 0,
                    "completed_at": None,
                }
                self.quests_db[key] = quest_record
                quests.append(quest_record)
        return quests

    def check_and_update_progress(
        self,
        user_id: str,
        event_type: str,
        payload: Dict[str, Any],
        date_str: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluate student action at submission time.
        Returns list of newly completed quest notifications.
        """
        if not date_str:
            date_str = get_lagos_date_str()

        quests = self.get_or_generate_quests(user_id, date_str)
        completed_now = []

        for q in quests:
            if q["completed_at"] is not None:
                continue

            criteria = q["criteria_type"]
            matched = False

            if criteria == "solve_tier" and event_type == "solve_challenge":
                tier = payload.get("tier", 1)
                min_t = q.get("min_tier", 1)
                if tier >= min_t:
                    q["current_count"] += 1
                    matched = True

            elif criteria == "solve_count" and event_type == "solve_challenge":
                q["current_count"] += 1
                matched = True

            elif criteria == "earn_xp" and event_type in ("earn_xp", "solve_challenge", "arcade_finish"):
                xp_gained = payload.get("xp", 0)
                q["current_count"] += xp_gained
                matched = True

            elif criteria == "win_arcade" and event_type == "arcade_finish":
                rank = payload.get("rank", 99)
                if rank == 1:
                    q["current_count"] += 1
                    matched = True

            elif criteria == "zero_error" and event_type == "solve_challenge":
                if payload.get("first_attempt", False):
                    q["current_count"] += 1
                    matched = True

            elif criteria == "consecutive_solves" and event_type == "solve_challenge":
                q["current_count"] += 1
                matched = True

            if matched and q["current_count"] >= q["target_count"]:
                q["completed_at"] = datetime.now(timezone.utc).isoformat()
                completed_now.append({
                    "quest_index": q["quest_index"],
                    "title": q["title"],
                    "reward_xp": q["reward_xp"],
                    "inline_message": f"+{q['reward_xp']} XP — quest complete!",
                })

        return completed_now
