"""
Test Suite: Phase 5.5 Academy Lifecycle
Tests:
- Academy creation with join code generation
- Initial pending subscription status
- Activation upon payment
- Owner dashboard statistics and access controls
"""

import unittest
from services.academies import AcademiesService


class TestAcademyLifecycle(unittest.TestCase):
    def setUp(self):
        self.service = AcademiesService()

    def test_academy_creation_defaults(self):
        academy = self.service.create_academy(
            name="Grace Hopper Prep",
            owner_id="owner_gh",
            plan="premium",
            billing_email="admin@gracehopper.edu",
        )
        self.assertEqual(academy["name"], "Grace Hopper Prep")
        self.assertEqual(academy["subscription_plan"], "premium")
        self.assertEqual(academy["subscription_status"], "pending")
        self.assertEqual(academy["seat_cap"], 30)
        self.assertEqual(len(academy["join_code"]), 6)
        self.assertTrue(academy["join_code"].isalnum())

    def test_cannot_join_pending_academy(self):
        academy = self.service.create_academy(
            name="Unpaid Academy",
            owner_id="owner_unpaid",
            plan="premium",
            auto_activate=False,
        )
        # Attempt to join while pending payment
        res = self.service.join_academy("student_x", academy["join_code"])
        self.assertEqual(res["status"], 403)
        self.assertEqual(res["error"], "academy_not_active")

    def test_owner_dashboard_access_control(self):
        academy = self.service.create_academy(
            name="Royal Budo Academy",
            owner_id="principal_kamau",
            plan="pro",
            auto_activate=True,
        )

        # Owner gets dashboard
        dash = self.service.get_owner_dashboard(academy["id"], "principal_kamau")
        self.assertEqual(dash["status"], 200)
        self.assertEqual(dash["seat_cap"], 100)
        self.assertEqual(dash["seats_used"], 0)

        # Non-owner is forbidden (403)
        intruder_dash = self.service.get_owner_dashboard(academy["id"], "random_user")
        self.assertEqual(intruder_dash["status"], 403)
        self.assertEqual(intruder_dash["error"], "forbidden_owner_only")


if __name__ == "__main__":
    unittest.main()
