"""
Phase 9A — Retention Mechanics: Friend Rivalries Service
Symmetric friendships capped at 10 friends per user.
Dedicated numbers-only leaderboard (XP today, streak, last active).
No chat, no feed, purely competitive pressure.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

MAX_FRIENDS_PER_USER = 10

class FriendsService:
    def __init__(self):
        # user_profiles: user_id -> {username, xp_today, total_xp, streak, last_active}
        self.profiles: Dict[str, Dict[str, Any]] = {}
        # username -> user_id
        self.username_index: Dict[str, str] = {}
        # (user_id, friend_id) -> {"status": "pending"|"accepted"|"blocked", "created_at": str, "accepted_at": str}
        self.friendships: Dict[tuple, Dict[str, Any]] = {}

    def register_user(self, user_id: str, username: str, xp_today: int = 0, total_xp: int = 0, streak: int = 1, last_active: Optional[str] = None):
        if not last_active:
            last_active = datetime.now(timezone.utc).isoformat()
        self.profiles[user_id] = {
            "user_id": user_id,
            "username": username,
            "xp_today": xp_today,
            "total_xp": total_xp,
            "streak": streak,
            "last_active": last_active,
        }
        self.username_index[username.lower()] = user_id

    def get_friend_count(self, user_id: str) -> int:
        count = 0
        for (u1, u2), val in self.friendships.items():
            if val["status"] == "accepted" and (u1 == user_id or u2 == user_id):
                count += 1
        return count

    def send_friend_request(self, requester_id: str, target_username: str) -> Dict[str, Any]:
        target_id = self.username_index.get(target_username.strip().lower())
        if not target_id:
            return {"status": 404, "error": "user_not_found", "message": f"User '{target_username}' does not exist."}

        if requester_id == target_id:
            return {"status": 400, "error": "cannot_friend_self", "message": "You cannot add yourself as a friend."}

        # Check max 10 friends limit for requester
        if self.get_friend_count(requester_id) >= MAX_FRIENDS_PER_USER:
            return {
                "status": 400,
                "error": "friend_limit_reached",
                "message": f"Maximum of {MAX_FRIENDS_PER_USER} friends reached.",
            }

        # Check target friends limit
        if self.get_friend_count(target_id) >= MAX_FRIENDS_PER_USER:
            return {
                "status": 400,
                "error": "target_friend_limit_reached",
                "message": f"{target_username} has already reached the maximum of {MAX_FRIENDS_PER_USER} friends.",
            }

        # Check existing friendship or pending request
        pair = (requester_id, target_id)
        reverse_pair = (target_id, requester_id)

        if pair in self.friendships:
            existing = self.friendships[pair]
            if existing["status"] == "accepted":
                return {"status": 400, "error": "already_friends", "message": "You are already friends."}
            elif existing["status"] == "pending":
                return {"status": 400, "error": "request_already_sent", "message": "Friend request already sent."}

        # If target had already sent request to requester, auto-accept symmetrically
        if reverse_pair in self.friendships and self.friendships[reverse_pair]["status"] == "pending":
            return self.accept_friend_request(requester_id, target_id)

        self.friendships[pair] = {
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "accepted_at": None,
        }
        return {"status": 200, "success": True, "message": f"Friend request sent to {target_username}."}

    def accept_friend_request(self, user_id: str, requester_id: str) -> Dict[str, Any]:
        pair = (requester_id, user_id)
        if pair not in self.friendships or self.friendships[pair]["status"] != "pending":
            return {"status": 404, "error": "no_pending_request", "message": "No pending friend request found."}

        # Check limits
        if self.get_friend_count(user_id) >= MAX_FRIENDS_PER_USER:
            return {"status": 400, "error": "friend_limit_reached", "message": f"Maximum of {MAX_FRIENDS_PER_USER} friends reached."}
        if self.get_friend_count(requester_id) >= MAX_FRIENDS_PER_USER:
            return {"status": 400, "error": "target_friend_limit_reached", "message": "Requester has reached the friend limit."}

        now_str = datetime.now(timezone.utc).isoformat()
        self.friendships[pair]["status"] = "accepted"
        self.friendships[pair]["accepted_at"] = now_str

        # Symmetric entry
        reverse_pair = (user_id, requester_id)
        self.friendships[reverse_pair] = {
            "status": "accepted",
            "created_at": self.friendships[pair]["created_at"],
            "accepted_at": now_str,
        }

        requester_name = self.profiles.get(requester_id, {}).get("username", "Friend")
        return {"status": 200, "success": True, "message": f"You and {requester_name} are now friends!"}

    def remove_friend(self, user_id: str, friend_id: str) -> Dict[str, Any]:
        self.friendships.pop((user_id, friend_id), None)
        self.friendships.pop((friend_id, user_id), None)
        return {"status": 200, "success": True, "message": "Friend removed."}

    def list_friends(self, user_id: str) -> Dict[str, Any]:
        friends = []
        pending_inbound = []
        pending_outbound = []

        for (u1, u2), val in self.friendships.items():
            if val["status"] == "accepted" and u1 == user_id:
                p = self.profiles.get(u2, {"user_id": u2, "username": "Coder", "xp_today": 0, "streak": 0, "last_active": "Unknown"})
                friends.append(p)
            elif val["status"] == "pending":
                if u2 == user_id:
                    # Inbound
                    p = self.profiles.get(u1, {"user_id": u1, "username": "Coder"})
                    pending_inbound.append({
                        "user_id": u1,
                        "username": p.get("username", "Coder"),
                        "created_at": val["created_at"],
                    })
                elif u1 == user_id:
                    # Outbound
                    p = self.profiles.get(u2, {"user_id": u2, "username": "Coder"})
                    pending_outbound.append({
                        "user_id": u2,
                        "username": p.get("username", "Coder"),
                        "created_at": val["created_at"],
                    })

        return {
            "friends": friends,
            "friend_count": len(friends),
            "max_friends": MAX_FRIENDS_PER_USER,
            "pending_inbound": pending_inbound,
            "pending_outbound": pending_outbound,
        }

    def get_friends_leaderboard(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Friends leaderboard:
        Shows user and only accepted friends.
        Ranked strictly by XP today descending, tie-broken by streak descending.
        """
        user_profile = self.profiles.get(user_id, {
            "user_id": user_id,
            "username": "You",
            "xp_today": 0,
            "streak": 1,
            "last_active": "Just now",
        })

        members = [user_profile]

        for (u1, u2), val in self.friendships.items():
            if val["status"] == "accepted" and u1 == user_id:
                p = self.profiles.get(u2)
                if p:
                    members.append(p)

        # Sort by xp_today desc, then streak desc, then username asc
        members.sort(key=lambda m: (-m.get("xp_today", 0), -m.get("streak", 0), m.get("username", "")))

        leaderboard = []
        for rank, m in enumerate(members, start=1):
            leaderboard.append({
                "rank": rank,
                "user_id": m["user_id"],
                "username": m["username"],
                "xp_today": m.get("xp_today", 0),
                "streak": m.get("streak", 0),
                "last_active": m.get("last_active", "Just now"),
                "is_current_user": m["user_id"] == user_id,
            })

        return leaderboard
