"""
Phase 5.5: Subscriptions & Paystack Webhook Handler
Handles academy subscription lifecycle:
- charge.success -> activates academy
- invoice.payment_failed -> marks academy lapsed
- subscription.disable -> cancels academy
"""

import hmac
import hashlib
from typing import Dict, Any, Optional

PLAN_CODES = {
    "PLN_academy_prem": "premium",
    "PLN_academy_pro": "pro",
}


class SubscriptionsService:
    def __init__(self, academies_service):
        self.academies_service = academies_service

    def verify_paystack_signature(self, raw_body: bytes, signature_header: str, secret_key: str) -> bool:
        if not signature_header or not secret_key:
            return False
        computed = hmac.new(
            secret_key.encode("utf-8"),
            raw_body,
            hashlib.sha512
        ).hexdigest()
        return hmac.compare_digest(computed, signature_header)

    def process_webhook_event(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        metadata = data.get("metadata", {})
        academy_id = metadata.get("academy_id")

        if not academy_id:
            # Not an academy subscription event
            return {"status": "ignored", "reason": "not_an_academy_event"}

        academy = self.academies_service.get_academy(academy_id)
        if not academy:
            return {"status": "error", "reason": f"academy {academy_id} not found"}

        if event_type == "charge.success":
            sub_code = data.get("subscription_code") or data.get("reference")
            cust_code = (data.get("customer") or {}).get("customer_code")
            academy["subscription_status"] = "active"
            academy["paystack_subscription_code"] = sub_code
            academy["paystack_customer_code"] = cust_code
            return {"status": "success", "event": "activated", "academy_id": academy_id}

        elif event_type == "invoice.payment_failed":
            academy["subscription_status"] = "lapsed"
            return {"status": "success", "event": "lapsed", "academy_id": academy_id}

        elif event_type == "subscription.disable":
            academy["subscription_status"] = "cancelled"
            return {"status": "success", "event": "cancelled", "academy_id": academy_id}

        return {"status": "ignored", "event": event_type}
