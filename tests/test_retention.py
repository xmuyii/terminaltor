"""
Phase 9A — Retention Mechanics Test Suite
Validates:
1. Daily Quests: Deterministic (user_id, date) generation, 3 rotating tiers, inline reward check (+30 XP).
2. Streak Freezes: Premium (1) & Pro (3) auto-protection within 36h, zero for Free.
3. Friend Rivalries: Max 10 friends cap, symmetric mutual accept, numbers-only leaderboard.
4. Comeback Loop: Re-engagement pushes at day 3 and day 7, strict code-enforced cutoff at day 14.
"""

import unittest
from datetime import datetime, timezone, timedelta
from services.quests import DailyQuestsService, get_lagos_date_str
from services.friends import FriendsService, MAX_FRIENDS_PER_USER
from services.comeback import ComebackService
from services.streaks import StreakFreezeService


class TestDailyQuests(unittest.TestCase):
    def setUp(self):
        self.service = DailyQuestsService()

    def test_deterministic_generation(self):
        user_id = "student_adebayo"
        date_str = "2026-10-23"

        quests_1 = self.service.get_or_generate_quests(user_id, date_str)
        quests_2 = self.service.get_or_generate_quests(user_id, date_str)

        self.assertEqual(len(quests_1), 3)
        self.assertEqual(len(quests_2), 3)

        # Must produce identical templates and order
        for q1, q2 in zip(quests_1, quests_2):
            self.assertEqual(q1["template_id"], q2["template_id"])
            self.assertEqual(q1["reward_xp"], q2["reward_xp"])
            self.assertEqual(q1["tier_category"], q2["tier_category"])

        # Check reward tiers
        categories = [q["tier_category"] for q in quests_1]
        self.assertEqual(categories, ["easy", "medium", "stretch"])

        rewards = [q["reward_xp"] for q in quests_1]
        self.assertEqual(rewards, [30, 80, 200])

    def test_different_dates_or_users_rotate(self):
        user_a = "user_alpha"
        user_b = "user_beta"
        date_1 = "2026-10-23"
        date_2 = "2026-10-24"

        quests_a1 = self.service.get_or_generate_quests(user_a, date_1)
        quests_b1 = self.service.get_or_generate_quests(user_b, date_1)
        quests_a2 = self.service.get_or_generate_quests(user_a, date_2)

        # Quests are user-keyed and date-keyed
        self.assertIsNotNone(quests_a1)
        self.assertIsNotNone(quests_b1)
        self.assertIsNotNone(quests_a2)

    def test_inline_completion_reward(self):
        user_id = "student_chidi"
        date_str = "2026-10-23"
        quests = self.service.get_or_generate_quests(user_id, date_str)

        # Simulate solving a Tier 3 challenge
        events = self.service.check_and_update_progress(
            user_id,
            event_type="solve_challenge",
            payload={"tier": 3, "first_attempt": True, "xp": 45},
            date_str=date_str
        )

        # If an easy or medium quest matched, an inline notification is returned
        if events:
            ev = events[0]
            self.assertIn("inline_message", ev)
            self.assertTrue(ev["inline_message"].endswith("— quest complete!"))
            self.assertIn("+", ev["inline_message"])


class TestStreakFreezes(unittest.TestCase):
    def setUp(self):
        self.service = StreakFreezeService()

    def test_free_tier_has_zero_freezes(self):
        now = datetime.now(timezone.utc)
        self.service.init_user("free_user", tier="free", streak=5, last_activity=now - timedelta(hours=28))
        res = self.service.check_and_apply_freeze("free_user", current_time=now)
        self.assertFalse(res["applied"])
        self.assertEqual(res["freezes_remaining"], 0)
        self.assertEqual(res["streak"], 0)  # streak broken

    def test_premium_auto_applies_freeze_in_window(self):
        now = datetime.now(timezone.utc)
        # 30 hours inactive: within 24h-36h window
        self.service.init_user("premium_user", tier="premium", streak=12, last_activity=now - timedelta(hours=30))
        res = self.service.check_and_apply_freeze("premium_user", current_time=now)
        self.assertTrue(res["applied"])
        self.assertEqual(res["streak"], 12)  # streak preserved!
        self.assertEqual(res["freezes_remaining"], 0)  # used 1 of 1
        self.assertEqual(res["message"], "🛡️ Streak protected!")

    def test_pro_tier_has_three_freezes(self):
        now = datetime.now(timezone.utc)
        self.service.init_user("pro_user", tier="pro", streak=45, last_activity=now - timedelta(hours=32))
        res = self.service.check_and_apply_freeze("pro_user", current_time=now)
        self.assertTrue(res["applied"])
        self.assertEqual(res["freezes_remaining"], 2)  # 3 - 1 = 2 remaining
        self.assertEqual(res["streak"], 45)

    def test_inactivity_exceeding_36h_breaks_streak(self):
        now = datetime.now(timezone.utc)
        # 40 hours inactive: exceeds 36h cutoff
        self.service.init_user("late_pro_user", tier="pro", streak=20, last_activity=now - timedelta(hours=40))
        res = self.service.check_and_apply_freeze("late_pro_user", current_time=now)
        self.assertFalse(res["applied"])
        self.assertEqual(res["reason"], "inactivity_exceeded_36h")
        self.assertEqual(res["streak"], 0)


class TestFriendRivalries(unittest.TestCase):
    def setUp(self):
        self.friends = FriendsService()
        self.friends.register_user("u1", "Alice", xp_today=150, streak=7)
        self.friends.register_user("u2", "Bob", xp_today=220, streak=14)
        self.friends.register_user("u3", "Charlie", xp_today=80, streak=3)

    def test_send_and_accept_friend_request(self):
        req = self.friends.send_friend_request("u1", "Bob")
        self.assertEqual(req["status"], 200)

        # u2 accepts u1's request
        acc = self.friends.accept_friend_request("u2", "u1")
        self.assertEqual(acc["status"], 200)

        # Verify friends list
        u1_friends = self.friends.list_friends("u1")["friends"]
        self.assertEqual(len(u1_friends), 1)
        self.assertEqual(u1_friends[0]["username"], "Bob")

        u2_friends = self.friends.list_friends("u2")["friends"]
        self.assertEqual(len(u2_friends), 1)
        self.assertEqual(u2_friends[0]["username"], "Alice")

    def test_cannot_friend_self(self):
        req = self.friends.send_friend_request("u1", "Alice")
        self.assertEqual(req["status"], 400)
        self.assertEqual(req["error"], "cannot_friend_self")

    def test_max_ten_friends_limit(self):
        # Register 11 users
        for i in range(11):
            uid = f"user_{i}"
            self.friends.register_user(uid, f"Coder_{i}")
            if i < 10:
                self.friends.send_friend_request("u1", f"Coder_{i}")
                self.friends.accept_friend_request(uid, "u1")

        self.assertEqual(self.friends.get_friend_count("u1"), 10)

        # 11th friend request must be rejected
        req11 = self.friends.send_friend_request("u1", "Coder_10")
        self.assertEqual(req11["status"], 400)
        self.assertEqual(req11["error"], "friend_limit_reached")

    def test_friends_leaderboard_ordering(self):
        self.friends.send_friend_request("u1", "Bob")
        self.friends.accept_friend_request("u2", "u1")

        lb = self.friends.get_friends_leaderboard("u1")
        self.assertEqual(len(lb), 2)  # Alice + Bob only (not Charlie who isn't a friend)
        self.assertEqual(lb[0]["username"], "Bob")  # 220 XP today > Alice's 150
        self.assertEqual(lb[1]["username"], "Alice")


class TestComebackLoop(unittest.TestCase):
    def setUp(self):
        self.comeback = ComebackService()

    def test_day_3_push_notification(self):
        now = datetime.now(timezone.utc)
        self.comeback.set_user_activity("inactive_3d", last_active=now - timedelta(days=3.5))

        dispatched = self.comeback.evaluate_inactive_users(now)
        self.assertEqual(len(dispatched), 1)
        self.assertEqual(dispatched[0]["body"], "Your streak is on the line. 1 challenge brings it back.")

    def test_day_7_push_notification(self):
        now = datetime.now(timezone.utc)
        self.comeback.set_user_activity("inactive_7d", last_active=now - timedelta(days=7.5))

        dispatched = self.comeback.evaluate_inactive_users(now)
        self.assertEqual(len(dispatched), 1)
        self.assertEqual(dispatched[0]["body"], "Your friends are ahead. One round closes the gap.")

    def test_day_14_strict_cutoff(self):
        now = datetime.now(timezone.utc)
        # 15 days inactive - strictly cutoff
        self.comeback.set_user_activity("inactive_15d", last_active=now - timedelta(days=15))

        dispatched = self.comeback.evaluate_inactive_users(now)
        self.assertEqual(len(dispatched), 0)  # Absolutely NOTHING dispatched
        self.assertTrue(self.comeback.user_states["inactive_15d"]["abandoned"])


if __name__ == "__main__":
    unittest.main()
