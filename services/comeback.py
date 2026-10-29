"""
Phase 9A — Retention Mechanics: Comeback Loop Service
Nightly re-engagement job identifying inactive students.
Day 3 push: "Your streak is on the line. 1 challenge brings it back."
Day 7 push: "Your friends are ahead. One round closes the gap."
Day 14+: STRICT CUTOFF. The system gives up. Never send anything after 14 days.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

class ComebackService:
    def __init__(self):
        # user_id -> {
        #   "last_active": datetime,
        #   "push_enabled": bool,
        #   "sent_day_3": bool,
        #   "sent_day_7": bool,
        #   "abandoned": bool
        # }
        self.user_states: Dict[str, Dict[str, Any]] = {}
        self.dispatched_notifications: List[Dict[str, Any]] = []

    def set_user_activity(self, user_id: str, last_active: datetime, push_enabled: bool = True):
        self.user_states[user_id] = {
            "last_active": last_active,
            "push_enabled": push_enabled,
            "sent_day_3": False,
            "sent_day_7": False,
            "abandoned": False,
        }

    def evaluate_inactive_users(self, current_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Evaluate users and enqueue PWA push notifications.
        Enforces strict Day 14 cutoff in code.
        """
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        new_notifications = []

        for user_id, state in self.user_states.items():
            if not state.get("push_enabled", False):
                continue

            last_active = state["last_active"]
            days_inactive = (current_time - last_active).total_seconds() / 86400.0

            # HARD RULE: Day 14+ cutoff - system gives up immediately
            if days_inactive >= 14.0:
                state["abandoned"] = True
                continue

            # Day 7 threshold
            if days_inactive >= 7.0:
                if not state.get("sent_day_7", False):
                    msg = {
                        "user_id": user_id,
                        "type": "comeback_day_7",
                        "title": "The Tech Academy",
                        "body": "Your friends are ahead. One round closes the gap.",
                        "days_inactive": round(days_inactive, 1),
                        "enqueued_at": current_time.isoformat(),
                    }
                    state["sent_day_7"] = True
                    self.dispatched_notifications.append(msg)
                    new_notifications.append(msg)
                continue

            # Day 3 threshold
            if days_inactive >= 3.0:
                if not state.get("sent_day_3", False):
                    msg = {
                        "user_id": user_id,
                        "type": "comeback_day_3",
                        "title": "The Tech Academy",
                        "body": "Your streak is on the line. 1 challenge brings it back.",
                        "days_inactive": round(days_inactive, 1),
                        "enqueued_at": current_time.isoformat(),
                    }
                    state["sent_day_3"] = True
                    self.dispatched_notifications.append(msg)
                    new_notifications.append(msg)
                continue

        return new_notifications
