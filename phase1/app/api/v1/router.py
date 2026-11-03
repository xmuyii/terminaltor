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


# In-memory verification storage for Phase 1 router
_pending_tg_auth: dict[str, dict] = {}


class TelegramCodeRequest(BaseModel):
    username: str


class TelegramCodeVerify(BaseModel):
    username: str = ""
    sessionToken: str = ""
    code: str


@api_v1_router.post("/auth/telegram/create-session", tags=["telegram"])
async def create_telegram_session():
    import random, secrets
    session_token = f"sess_{secrets.token_hex(6)}"
    code = str(random.randint(100000, 999999))
    _pending_tg_auth[session_token] = {
        "code": code,
        "username": "",  # Bound upon Telegram bot /start
        "sessionToken": session_token,
        "verified": False,
    }

    raw_bot = os.getenv("VITE_TELEGRAM_BOT_USERNAME", "Hqgamebot")
    bot_username = raw_bot.lstrip("@").strip() or "Hqgamebot"

    return {
        "success": True,
        "sessionToken": session_token,
        "botUsername": bot_username,
        "deepLink": f"https://t.me/{bot_username}?start=auth_{session_token}",
        "message": f"Session created. Open @{bot_username} in Telegram to verify.",
    }


@api_v1_router.post("/auth/telegram/request-code", tags=["telegram"])
async def request_telegram_code(req: TelegramCodeRequest):
    import random, secrets
    raw = req.username.replace("@", "").strip().lower()
    if not raw or len(raw) < 3:
        return {"success": False, "message": "Username must be at least 3 characters."}

    session_token = secrets.token_hex(6)
    code = str(random.randint(100000, 999999))
    _pending_tg_auth[session_token] = {
        "code": code,
        "username": raw,
        "sessionToken": session_token,
        "verified": False,
    }
    # Also index by username for fallback
    _pending_tg_auth[raw] = _pending_tg_auth[session_token]

    raw_bot = os.getenv("VITE_TELEGRAM_BOT_USERNAME", "Hqgamebot")
    bot_username = raw_bot.lstrip("@").strip() or "Hqgamebot"

    # SECURITY: Never return code to client! Only sessionToken and deepLink
    return {
        "success": True,
        "sessionToken": session_token,
        "username": f"@{raw}",
        "botUsername": bot_username,
        "deepLink": f"https://t.me/{bot_username}?start=auth_{session_token}",
        "message": f"Verification challenge created for @{raw}. Open @{bot_username} in Telegram to verify.",
    }


@api_v1_router.get("/auth/telegram/check-status", tags=["telegram"])
async def check_telegram_status(username: str = "", sessionToken: str = "", token: str = ""):
    key = (sessionToken or token or username).replace("@", "").strip().lower()
    record = _pending_tg_auth.get(key)

    if record:
        if record.get("verified"):
            return {
                "success": True,
                "verified": True,
                "user": {
                    "id": record.get("tg_id", f"tg_{record.get('username')}"),
                    "username": f"@{record.get('username')}",
                    "first_name": record.get("first_name", record.get("username")),
                    "is_webapp": False,
                },
            }
        if record.get("mismatchedUser"):
            return {
                "success": False,
                "verified": False,
                "mismatch": True,
                "message": f"Account mismatch! The Telegram user who tapped the bot was @{record.get('mismatchedUser')}.",
            }

    return {"success": True, "verified": False}


@api_v1_router.post("/auth/telegram/verify-code", tags=["telegram"])
async def verify_telegram_code(req: TelegramCodeVerify):
    key = (req.sessionToken or req.username).replace("@", "").strip().lower()
    input_code = req.code.strip()

    record = _pending_tg_auth.get(key)
    if not record:
        return {"success": False, "message": "No pending verification found. Please request a new code."}

    if record.get("code") != input_code:
        return {"success": False, "message": "Incorrect verification code. Please check Telegram."}

    record["verified"] = True
    _pending_tg_auth.pop(key, None)
    return {
        "success": True,
        "verified": True,
        "user": {
            "id": record.get("tg_id", f"tg_{record.get('username')}"),
            "username": f"@{record.get('username')}",
            "first_name": record.get("first_name", record.get("username")),
            "is_webapp": False,
        },
    }


@api_v1_router.post("/telegram/webhook", tags=["telegram"])
async def telegram_webhook(update: dict):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    app_url = os.getenv("APP_URL", "https://terminaltor.vercel.app")

    # Handle pre_checkout_query
    if "pre_checkout_query" in update:
        query_id = update["pre_checkout_query"].get("id")
        if bot_token and query_id:
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/answerPreCheckoutQuery",
                        json={"pre_checkout_query_id": query_id, "ok": True},
                    )
            except Exception:
                pass
        return {"ok": True}

    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    from_user = message.get("from", {})
    actual_username = (from_user.get("username") or "").lower()
    text = (message.get("text") or "").strip()

    if text.startswith("/start auth_"):
        parts = text.split("auth_")
        if len(parts) > 1:
            session_token = parts[1].strip()
            record = _pending_tg_auth.get(session_token)

            if not record:
                # search values
                for v in _pending_tg_auth.values():
                    if v.get("sessionToken") == session_token:
                        record = v
                        break

            if record:
                if not record.get("username"):
                    record["username"] = from_user.get("username") or from_user.get("first_name") or f"cadet_{from_user.get('id')}"
                else:
                    expected_username = record.get("username", "").lower()
                    is_owner = (actual_username == expected_username) or (not actual_username and from_user.get("first_name", "").lower() == expected_username)

                    if not is_owner:
                        record["mismatchedUser"] = from_user.get("username") or from_user.get("first_name")
                        if bot_token and chat_id:
                            try:
                                import httpx
                                async with httpx.AsyncClient() as client:
                                    await client.post(
                                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                                        json={
                                            "chat_id": chat_id,
                                            "text": f"⛔ ACCESS DENIED: Account Mismatch!\n\nYou are logged into Telegram as @{from_user.get('username') or from_user.get('first_name')}.\nYou cannot verify the account @{record.get('username')}.",
                                        },
                                    )
                            except Exception:
                                pass
                        return {"ok": True, "error": "username_mismatch"}

                # Verified!
                record["verified"] = True
                record["tg_id"] = str(from_user.get("id"))
                record["first_name"] = from_user.get("first_name", "")

                if bot_token and chat_id:
                    try:
                        import httpx
                        async with httpx.AsyncClient() as client:
                            await client.post(
                                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                                json={
                                    "chat_id": chat_id,
                                    "text": f"⚡ ACCESS GRANTED, Cadet @{from_user.get('username') or from_user.get('first_name')}!\n\nYour Telegram identity is authenticated.\n\n🔑 Your One-Time Security PIN: [ {record.get('code')} ]\n\nYour browser will auto-unlock, or tap below to play directly in Telegram:",
                                    "reply_markup": {
                                        "inline_keyboard": [
                                            [
                                                {
                                                    "text": "🎮 Launch TERMINALTOR",
                                                    "web_app": {"url": app_url},
                                                }
                                            ]
                                        ]
                                    },
                                },
                            )
                    except Exception:
                        pass

                return {"ok": True, "verified": True}

    if bot_token and chat_id:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": "⚡ TERMINALTOR: Python Logic Cyber Arena\n\nDeveloped by IRETE LABS, powered by Ose Engine.\n\nTap below to launch:",
                        "reply_markup": {
                            "inline_keyboard": [
                                [
                                    {
                                        "text": "🎮 Play TERMINALTOR",
                                        "web_app": {"url": app_url},
                                    }
                                ]
                            ]
                        },
                    },
                )
        except Exception:
            pass

    return {"ok": True}


api_v1_router.include_router(challenges_router)
api_v1_router.include_router(execute_router)
