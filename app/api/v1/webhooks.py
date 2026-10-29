"""
FastAPI Webhooks for Paystack Events
Routes academy events to Academies state machine, and individual events to Subscriptions state machine.
"""

from fastapi import APIRouter, Request, Header, HTTPException
import json
import os

from app.services.academies import AcademiesService
from app.services.subscriptions import SubscriptionsService

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])

academies_service = AcademiesService()
subscriptions_service = SubscriptionsService(academies_service)
PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_mock_secret")


@router.post("/paystack")
async def handle_paystack_webhook(
    request: Request,
    x_paystack_signature: str = Header(None),
):
    body_bytes = await request.body()
    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON")

    event_type = payload.get("event")
    data = payload.get("data", {})
    metadata = data.get("metadata", {})

    # Route based on metadata type
    if metadata.get("type") == "academy" or "academy_id" in metadata:
        result = subscriptions_service.process_webhook_event(event_type, data)
        return {"status": "ok", "routed_to": "academy", "result": result}
    else:
        # Standard individual subscription
        return {"status": "ok", "routed_to": "individual", "event": event_type}
