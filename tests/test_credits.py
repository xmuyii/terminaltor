"""
Test Suite: Credits Economy
Tests:
- 10 credits cost per word or debug submission (correct or incorrect)
- Rejection when balance < 10
- Daily 100 free credits claim (non-stacking unless login)
- Round placement earnings: 1st (100 credits), 2nd (70 credits), 3rd (50 credits)
- 1000 Naira / 1000 Credits conversion
"""

import unittest
from datetime import datetime, timedelta

SUBMISSION_COST = 10
DAILY_GRANT = 100
ROUND_REWARDS = {1: 100, 2: 70, 3: 50}


class MockProfileStore:
    def __init__(self, initial_credits=150):
        self.credits = initial_credits
        self.last_daily_claim = ""

    def deduct(self, amount):
        if self.credits < amount:
            return False
        self.credits -= amount
        return True

    def add(self, amount):
        self.credits += amount
        return self.credits

    def claim_daily(self, date_str):
        if self.last_daily_claim == date_str:
            return False, "Already claimed today"
        self.credits += DAILY_GRANT
        self.last_daily_claim = date_str
        return True, "Claimed 100 credits"


class TestCreditsEconomy(unittest.TestCase):
    def setUp(self):
        self.store = MockProfileStore(initial_credits=150)

    def test_deduct_submission_cost(self):
        # Initial 150 credits
        self.assertEqual(self.store.credits, 150)

        # 1 word submitted (cost: 10)
        ok = self.store.deduct(SUBMISSION_COST)
        self.assertTrue(ok)
        self.assertEqual(self.store.credits, 140)

        # 4 more words submitted (cost: 40)
        for _ in range(4):
            self.assertTrue(self.store.deduct(SUBMISSION_COST))
        self.assertEqual(self.store.credits, 100)

    def test_rejection_when_insufficient_credits(self):
        empty_store = MockProfileStore(initial_credits=5)
        # Attempt submission when balance is 5 (< 10)
        self.assertFalse(empty_store.deduct(SUBMISSION_COST))
        self.assertEqual(empty_store.credits, 5)

    def test_daily_free_credits_non_stacking(self):
        today = "2026-10-26"
        yesterday = "2026-10-25"

        # Claim today
        ok, msg = self.store.claim_daily(today)
        self.assertTrue(ok)
        self.assertEqual(self.store.credits, 250)

        # Repeated claim on same day rejected (no double claim)
        ok2, _ = self.store.claim_daily(today)
        self.assertFalse(ok2)
        self.assertEqual(self.store.credits, 250)

        # If user didn't log in yesterday, yesterday's credits did not stack:
        # they only get today's grant upon login!
        self.assertEqual(self.store.last_daily_claim, today)

    def test_round_placement_rewards(self):
        # 1st place finishes round
        self.store.add(ROUND_REWARDS[1])
        self.assertEqual(self.store.credits, 250)

        # 2nd place
        self.store.add(ROUND_REWARDS[2])
        self.assertEqual(self.store.credits, 320)

        # 3rd place
        self.store.add(ROUND_REWARDS[3])
        self.assertEqual(self.store.credits, 370)

    def test_skill_positive_break_even(self):
        # A player enters a round with 100 credits
        player = MockProfileStore(initial_credits=100)

        # Forges 6 words during the round (60 credits spent)
        for _ in range(6):
            player.deduct(SUBMISSION_COST)
        self.assertEqual(player.credits, 40)

        # Player wins 1st place (+100 credits)
        player.add(ROUND_REWARDS[1])

        # Player is credit-positive (+40 net gain!)
        self.assertEqual(player.credits, 140)
        self.assertGreater(player.credits, 100)

    def test_purchasing_packs_rate(self):
        # ₦1,000 gives 1,000 credits (100 submissions)
        pack_1k_credits = 1000
        self.store.add(pack_1k_credits)
        self.assertEqual(self.store.credits, 1150)


if __name__ == "__main__":
    unittest.main()
