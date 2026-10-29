"""
Phase 9A — Retention Mechanics: Streak Freeze Service
Automatic streak preservation for paid tiers:
Premium: 1 freeze / month
Pro: 3 freezes / month
Auto-applies when streak is about to break (24-36h window since last activity).
Silently preserves streak with "🛡️ Streak protected!" status.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, Any

FREEZES_BY_TIER = {
    "free": 0,
    "premium": 1,
    "pro": 3,
}

class StreakFreezeService:
    def __init__(self):
        # user_id -> {
        #   "tier": str,
        #   "streak": int,
        #   "freezes_remaining": int,
        #   "last_activity": datetime,
        #   "last_protected_at": Optional[datetime],
        #   "month_start": str
        # }
        self.user_records: Dict[str, Dict[str, Any]] = {}

    def init_user(
        self,
        user_id: str,
        tier: str = "free",
        streak: int = 1,
        last_activity: Optional[datetime] = None,
        freezes_remaining: Optional[int] = None
    ):
        if last_activity is None:
            last_activity = datetime.now(timezone.utc)
        if freezes_remaining is None:
            freezes_remaining = FREEZES_BY_TIER.get(tier.lower(), 0)

        month_str = last_activity.strftime("%Y-%m-01")
        self.user_records[user_id] = {
            "tier": tier.lower(),
            "streak": streak,
            "freezes_remaining": freezes_remaining,
            "last_activity": last_activity,
            "last_protected_at": None,
            "month_start": month_str,
        }

    def check_and_apply_freeze(self, user_id: str, current_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Check if streak freeze should be auto-applied.
        Condition:
          - User is Premium or Pro with freezes_remaining > 0
          - Inactivity is between 24h and 36h
        """
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        user = self.user_records.get(user_id)
        if not user:
            return {"applied": False, "reason": "user_not_found"}

        last_act = user["last_activity"]
        hours_elapsed = (current_time - last_act).total_seconds() / 3600.0

        # If user was active today (< 24 hours), streak is safe
        if hours_elapsed < 24.0:
            return {
                "applied": False,
                "streak": user["streak"],
                "freezes_remaining": user["freezes_remaining"],
                "reason": "streak_active",
            }

        # If user has been inactive for > 36 hours, freeze window expired
        if hours_elapsed > 36.0:
            return {
                "applied": False,
                "streak": 0,  # streak broken
                "freezes_remaining": user["freezes_remaining"],
                "reason": "inactivity_exceeded_36h",
            }

        # 24h to 36h window: streak is about to break!
        if user["freezes_remaining"] <= 0 or user["tier"] not in ("premium", "pro"):
            return {
                "applied": False,
                "streak": 0,  # broken streak for free / exhausted freezes
                "freezes_remaining": 0,
                "reason": "no_freezes_available",
            }

        # Auto-apply freeze!
        user["freezes_remaining"] -= 1
        user["last_protected_at"] = current_time
        # Bump simulated activity window so streak doesn't break
        user["last_activity"] = current_time - timedelta(hours=20)

        return {
            "applied": True,
            "streak": user["streak"],
            "freezes_remaining": user["freezes_remaining"],
            "message": "🛡️ Streak protected!",
            "protected_at": current_time.isoformat(),
        }
