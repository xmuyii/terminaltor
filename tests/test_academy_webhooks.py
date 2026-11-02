"""
Test Suite: Phase 5.5 Academy Paystack Webhooks
Tests:
- charge.success activates pending academy
- invoice.payment_failed marks academy lapsed
- subscription.disable marks academy cancelled
- Graceful ignore of unknown/non-academy events
"""

import unittest
from services.academies import AcademiesService
from services.subscriptions import SubscriptionsService


class TestAcademyWebhooks(unittest.TestCase):
    def setUp(self):
        self.academies_service = AcademiesService()
        self.subs_service = SubscriptionsService(self.academies_service)

        self.academy = self.academies_service.create_academy(
            name="Corona Secondary School",
            owner_id="admin_corona",
            plan="premium",
            auto_activate=False,
        )

    def test_charge_success_activates_academy(self):
        self.assertEqual(self.academy["subscription_status"], "pending")

        event_payload = {
            "metadata": {
                "academy_id": self.academy["id"],
                "plan": "premium",
            },
            "subscription_code": "SUB_test_12345",
            "customer": {"customer_code": "CUS_test_67890"},
        }

        res = self.subs_service.process_webhook_event("charge.success", event_payload)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["event"], "activated")

        # Verify academy is now active
        updated = self.academies_service.get_academy(self.academy["id"])
        self.assertEqual(updated["subscription_status"], "active")
        self.assertEqual(updated["paystack_subscription_code"], "SUB_test_12345")

    def test_invoice_payment_failed_lapses_academy(self):
        # Set to active first
        self.academy["subscription_status"] = "active"

        event_payload = {
            "metadata": {
                "academy_id": self.academy["id"],
            },
        }

        res = self.subs_service.process_webhook_event("invoice.payment_failed", event_payload)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["event"], "lapsed")

        updated = self.academies_service.get_academy(self.academy["id"])
        self.assertEqual(updated["subscription_status"], "lapsed")

    def test_subscription_disable_cancels_academy(self):
        self.academy["subscription_status"] = "active"

        event_payload = {
            "metadata": {
                "academy_id": self.academy["id"],
            },
        }

        res = self.subs_service.process_webhook_event("subscription.disable", event_payload)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["event"], "cancelled")

        updated = self.academies_service.get_academy(self.academy["id"])
        self.assertEqual(updated["subscription_status"], "cancelled")

    def test_ignore_non_academy_events(self):
        event_payload = {
            "metadata": {
                "user_id": "solo_student_123",
                "tier": "individual_premium",
            },
        }
        res = self.subs_service.process_webhook_event("charge.success", event_payload)
        self.assertEqual(res["status"], "ignored")


if __name__ == "__main__":
    unittest.main()
