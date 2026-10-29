"""
Phase 5.5: Academies Service
CRUD operations, seat allocation, join code enforcement, and membership management.
"""

import uuid
import random
import string
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

JOIN_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
SEAT_CAP_PREMIUM = 30
SEAT_CAP_PRO = 100
PRICE_PREMIUM_KOBO = 2500000  # ₦25,000/mo
PRICE_PRO_KOBO = 7500000      # ₦75,000/mo


def generate_academy_join_code() -> str:
    return "".join(random.choice(JOIN_CODE_ALPHABET) for _ in range(6))


class AcademiesService:
    def __init__(self):
        # In-memory stores for testing and execution
        self.academies: Dict[str, Dict[str, Any]] = {}
        self.members: List[Dict[str, Any]] = []  # list of membership records
        self.user_profiles: Dict[str, Dict[str, Any]] = {}

    def create_academy(
        self,
        name: str,
        owner_id: str,
        plan: str,
        billing_email: Optional[str] = None,
        auto_activate: bool = False,
    ) -> Dict[str, Any]:
        plan_clean = plan.lower().strip()
        if plan_clean not in ("premium", "pro"):
            raise ValueError(f"Invalid plan '{plan}'. Must be 'premium' or 'pro'.")

        seat_cap = SEAT_CAP_PRO if plan_clean == "pro" else SEAT_CAP_PREMIUM
        academy_id = str(uuid.uuid4())
        join_code = generate_academy_join_code()

        # Guarantee unique join code
        while any(a["join_code"] == join_code for a in self.academies.values()):
            join_code = generate_academy_join_code()

        now = datetime.now(timezone.utc).isoformat()
        status = "active" if auto_activate else "pending"

        academy = {
            "id": academy_id,
            "name": name.strip(),
            "owner_id": owner_id,
            "join_code": join_code,
            "subscription_plan": plan_clean,
            "subscription_status": status,
            "paystack_subscription_code": None,
            "paystack_customer_code": None,
            "seat_cap": seat_cap,
            "billing_email": billing_email,
            "created_at": now,
            "updated_at": now,
        }
        self.academies[academy_id] = academy
        return academy

    def get_academy(self, academy_id: str) -> Optional[Dict[str, Any]]:
        return self.academies.get(academy_id)

    def get_academy_by_join_code(self, join_code: str) -> Optional[Dict[str, Any]]:
        clean = join_code.strip().upper()
        for a in self.academies.values():
            if a["join_code"].upper() == clean:
                return a
        return None

    def get_active_members(self, academy_id: str) -> List[Dict[str, Any]]:
        return [
            m for m in self.members
            if m["academy_id"] == academy_id and m.get("removed_at") is None
        ]

    def get_active_academy_for_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        for m in self.members:
            if m["user_id"] == user_id and m.get("removed_at") is None:
                academy = self.academies.get(m["academy_id"])
                if academy:
                    return academy
        return None

    def join_academy(self, user_id: str, join_code: str) -> Dict[str, Any]:
        academy = self.get_academy_by_join_code(join_code)
        if not academy:
            return {"status": 404, "error": "academy_not_found", "message": "No academy matches this join code."}

        # Check academy subscription
        if academy.get("subscription_status") != "active":
            return {
                "status": 403,
                "error": "academy_not_active",
                "message": f"Academy subscription is {academy.get('subscription_status')}.",
            }

        # Check if student is already in an active academy
        existing_academy = self.get_active_academy_for_user(user_id)
        if existing_academy:
            if existing_academy["id"] == academy["id"]:
                return {
                    "status": 200,
                    "message": "Already an active member of this academy.",
                    "academy": academy,
                }
            return {
                "status": 409,
                "error": "already_in_academy",
                "message": f"Students may only belong to 1 active academy at a time. Leave '{existing_academy['name']}' first.",
            }

        # Check seat capacity
        active_members = self.get_active_members(academy["id"])
        if len(active_members) >= academy["seat_cap"]:
            return {
                "status": 409,
                "error": "seat_cap_exceeded",
                "message": f"Academy has reached its maximum seat capacity of {academy['seat_cap']} students.",
            }

        # Check if previously removed and re-activate or add new
        now = datetime.now(timezone.utc).isoformat()
        for m in self.members:
            if m["academy_id"] == academy["id"] and m["user_id"] == user_id:
                m["removed_at"] = None
                m["joined_at"] = now
                return {"status": 200, "message": "Re-enrolled in academy.", "membership": m, "academy": academy}

        membership = {
            "id": str(uuid.uuid4()),
            "academy_id": academy["id"],
            "user_id": user_id,
            "joined_at": now,
            "removed_at": None,
        }
        self.members.append(membership)
        return {"status": 200, "message": "Successfully enrolled in academy.", "membership": membership, "academy": academy}

    def remove_member(self, academy_id: str, owner_id: str, target_user_id: str) -> Dict[str, Any]:
        academy = self.get_academy(academy_id)
        if not academy:
            return {"status": 404, "error": "academy_not_found"}

        if academy["owner_id"] != owner_id:
            return {"status": 403, "error": "forbidden_owner_only"}

        for m in self.members:
            if m["academy_id"] == academy_id and m["user_id"] == target_user_id and m.get("removed_at") is None:
                m["removed_at"] = datetime.now(timezone.utc).isoformat()
                return {"status": 200, "message": "Student seat vacated successfully."}

        return {"status": 404, "error": "member_not_found"}

    def get_owner_dashboard(self, academy_id: str, owner_id: str) -> Dict[str, Any]:
        academy = self.get_academy(academy_id)
        if not academy:
            return {"status": 404, "error": "academy_not_found"}

        if academy["owner_id"] != owner_id:
            return {"status": 403, "error": "forbidden_owner_only"}

        active = self.get_active_members(academy_id)
        return {
            "status": 200,
            "academy": academy,
            "seat_cap": academy["seat_cap"],
            "seats_used": len(active),
            "seats_remaining": max(0, academy["seat_cap"] - len(active)),
            "members": active,
        }
