"""
Test Suite: Phase 5.5 Academy Entitlements
Tests:
- Dual-track hierarchy: max(individual_tier, academy_tier)
- Lapsed academy drops student back to personal tier (never below)
- Pro student in Premium academy retains Pro
- Challenge tier unlocking and daily hint allowance
"""

import unittest
from services.entitlements import EntitlementsService


class TestAcademyEntitlements(unittest.TestCase):
    def setUp(self):
        self.service = EntitlementsService()

    def test_free_student_gets_academy_premium(self):
        tier = self.service.resolve_effective_tier(
            individual_tier="free",
            academy_tier="premium",
            academy_active=True,
        )
        self.assertEqual(tier, "premium")

        entitlements = self.service.get_entitlements(
            user_id="student_1",
            individual_tier="free",
            academy_tier="premium",
            academy_active=True,
        )
        self.assertEqual(entitlements["effective_tier"], "premium")
        self.assertEqual(entitlements["unlocked_tiers"], list(range(1, 11)))
        self.assertEqual(entitlements["hints_per_day"], 3)
        self.assertEqual(entitlements["freezes_per_month"], 1)

    def test_pro_student_retains_pro_in_premium_academy(self):
        # Higher of the two tiers must always win
        tier = self.service.resolve_effective_tier(
            individual_tier="pro",
            academy_tier="premium",
            academy_active=True,
        )
        self.assertEqual(tier, "pro")

        entitlements = self.service.get_entitlements(
            user_id="student_2",
            individual_tier="pro",
            academy_tier="premium",
            academy_active=True,
        )
        self.assertEqual(entitlements["effective_tier"], "pro")
        self.assertEqual(entitlements["hints_per_day"], 5)
        self.assertEqual(entitlements["freezes_per_month"], 3)

    def test_lapsed_academy_drops_student_to_individual_tier(self):
        # When academy lapses (academy_active=False), student drops to individual tier
        tier_free = self.service.resolve_effective_tier(
            individual_tier="free",
            academy_tier="premium",
            academy_active=False,
        )
        self.assertEqual(tier_free, "free")

        # But a student with personal Premium stays on Premium
        tier_prem = self.service.resolve_effective_tier(
            individual_tier="premium",
            academy_tier="premium",
            academy_active=False,
        )
        self.assertEqual(tier_prem, "premium")

    def test_cancelled_academy_does_not_destroy_personal_pro(self):
        tier = self.service.resolve_effective_tier(
            individual_tier="pro",
            academy_tier="pro",
            academy_active=False,
        )
        self.assertEqual(tier, "pro")


if __name__ == "__main__":
    unittest.main()
