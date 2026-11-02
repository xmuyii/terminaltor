import os
import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.v1.challenges import router as challenges_router
from app.api.v1.execute import router as execute_router
from app.models.schemas import UserProfile

api_v1_router = APIRouter(prefix="/api/v1")


@api_v1_router.get("/me", response_model=UserProfile, tags=["auth"])
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return current_user


class CreateTelegramInvoiceRequest(BaseModel):
    title: str = "Arcade Credits"
    description: str = "TERMINALTOR Credits"
    payload: str = "stars_payload"
    stars_amount: int = 70


@api_v1_router.post("/telegram/create-invoice", tags=["telegram"])
async def create_telegram_invoice(req: CreateTelegramInvoiceRequest):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if bot_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/createInvoiceLink",
                    json={
                        "title": req.title,
                        "description": req.description,
                        "payload": req.payload,
                        "currency": "XTR",
                        "prices": [{"label": req.title, "amount": req.stars_amount}],
                    },
                )
                data = res.json()
                if data.get("ok") and data.get("result"):
                    return {"success": True, "invoiceLink": data["result"]}
        except Exception:
            pass

    return {
        "success": True,
        "isSimulated": True,
        "invoiceLink": None,
        "message": "Invoice simulated (TELEGRAM_BOT_TOKEN pending configuration in environment)",
    }


api_v1_router.include_router(challenges_router)
api_v1_router.include_router(execute_router)
