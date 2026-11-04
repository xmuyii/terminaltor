import os
import json
import logging
import hashlib
import time
import secrets
import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.v1.challenges import router as challenges_router
from app.api.v1.execute import router as execute_router
from app.models.schemas import UserProfile

logger = logging.getLogger(__name__)

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
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or "8761897858:AAGpW_aPC02Rg_W4t7Du8Y9SJOETZAVIgm8"
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
        except Exception as e:
            logger.warning(f"Error creating invoice link: {e}")

    return {
        "success": True,
        "isSimulated": True,
        "invoiceLink": None,
        "message": "Invoice simulated",
    }


# In-memory and disk verification storage for Phase 1 router
_pending_tg_auth: dict[str, dict] = {}
AUTH_CACHE_FILE = "/tmp/pending_tg_auth.json"


def normalize_app_url(url: str | None = None) -> str:
    raw = (url or os.getenv("APP_URL") or "https://terminaltor-olive.vercel.app").strip()
    if not raw:
        return "https://terminaltor-olive.vercel.app"
    if not raw.startswith("http://") and not raw.startswith("https://"):
        raw = f"https://{raw.lstrip('/')}"
    elif raw.startswith("http://"):
        raw = f"https://{raw[7:]}"
    return raw.rstrip("/")


def save_auth_record(key: str, data: dict):
    if not key:
        return
    clean_key = key.replace("@", "").strip().lower()
    _pending_tg_auth[clean_key] = data
    try:
        store = {}
        if os.path.exists(AUTH_CACHE_FILE):
            try:
                with open(AUTH_CACHE_FILE, "r") as f:
                    store = json.load(f)
            except Exception:
                store = {}
        store[clean_key] = data
        if data.get("code"):
            store[str(data["code"])] = data
        if data.get("sessionToken"):
            store[str(data["sessionToken"])] = data
        if data.get("username"):
            store[data["username"].replace("@", "").lower()] = data
        if data.get("tg_id"):
            store[str(data["tg_id"])] = data
        with open(AUTH_CACHE_FILE, "w") as f:
            json.dump(store, f)
    except Exception as e:
        logger.warning(f"Error saving auth cache: {e}")


def get_auth_record(key: str) -> dict | None:
    if not key:
        return None
    clean_key = key.replace("@", "").strip().lower()
    if clean_key in _pending_tg_auth:
        return _pending_tg_auth[clean_key]
    try:
        if os.path.exists(AUTH_CACHE_FILE):
            with open(AUTH_CACHE_FILE, "r") as f:
                store = json.load(f)
                return store.get(clean_key)
    except Exception:
        pass
    return None


def generate_stateless_pin(identifier: str) -> str:
    window = int(time.time() // 900)  # 15-minute validity window
    data = f"{identifier}:{window}:TERMINALTOR_SOVEREIGN_2026".encode("utf-8")
    h = hashlib.sha256(data).hexdigest()
    return str(int(h[:8], 16) % 900000 + 100000)


def verify_stateless_pin(identifier: str, pin: str) -> bool:
    if not pin or len(pin) != 6:
        return False
    clean_pin = pin.strip()
    for offset in (0, -1, 1):
        window = int(time.time() // 900) + offset
        data = f"{identifier}:{window}:TERMINALTOR_SOVEREIGN_2026".encode("utf-8")
        h = hashlib.sha256(data).hexdigest()
        expected = str(int(h[:8], 16) % 900000 + 100000)
        if expected == clean_pin:
            return True
    return False


class TelegramCodeRequest(BaseModel):
    username: str


class TelegramCodeVerify(BaseModel):
    username: str = ""
    sessionToken: str = ""
    code: str


@api_v1_router.post("/auth/telegram/create-session", tags=["telegram"])
async def create_telegram_session():
    session_token = f"sess_{secrets.token_hex(6)}"
    code = generate_stateless_pin(session_token)
    session_record = {
        "code": code,
        "username": "",  # Bound upon Telegram bot /start
        "sessionToken": session_token,
        "verified": False,
    }
    save_auth_record(session_token, session_record)
    save_auth_record(code, session_record)

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
    raw = req.username.replace("@", "").strip().lower()
    if not raw or len(raw) < 3:
        return {"success": False, "message": "Username must be at least 3 characters."}

    session_token = f"sess_{secrets.token_hex(6)}"
    code = generate_stateless_pin(raw)
    data = {
        "code": code,
        "username": raw,
        "sessionToken": session_token,
        "verified": False,
    }
    save_auth_record(session_token, data)
    save_auth_record(raw, data)
    save_auth_record(code, data)

    raw_bot = os.getenv("VITE_TELEGRAM_BOT_USERNAME", "Hqgamebot")
    bot_username = raw_bot.lstrip("@").strip() or "Hqgamebot"

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
    record = get_auth_record(key)

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

    record = get_auth_record(key) or get_auth_record(input_code)
    is_valid = False

    if record and record.get("code") == input_code:
        is_valid = True
    elif req.sessionToken and verify_stateless_pin(req.sessionToken, input_code):
        is_valid = True
    elif req.username and verify_stateless_pin(req.username.replace("@", "").lower(), input_code):
        is_valid = True
    elif record and record.get("tg_id") and verify_stateless_pin(str(record.get("tg_id")), input_code):
        is_valid = True
    else:
        # Check if input_code matches any cached record in store
        cached = get_auth_record(input_code)
        if cached:
            is_valid = True
            record = cached

    if not is_valid:
        return {"success": False, "message": "Incorrect verification code. Please check your Telegram chat with @Hqgamebot."}

    username = (record.get("username") if record else req.username.replace("@", "")) or "Cadet"
    tg_id = (record.get("tg_id") if record else f"tg_{username}")
    first_name = (record.get("first_name") if record else username)

    return {
        "success": True,
        "verified": True,
        "user": {
            "id": tg_id,
            "username": f"@{username.lstrip('@')}",
            "first_name": first_name,
            "is_webapp": False,
        },
    }


@api_v1_router.post("/telegram/webhook", tags=["telegram"])
async def telegram_webhook(update: dict):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or "8761897858:AAGpW_aPC02Rg_W4t7Du8Y9SJOETZAVIgm8"
    app_url = normalize_app_url(os.getenv("APP_URL"))

    # Handle pre_checkout_query (Telegram Stars payments)
    if "pre_checkout_query" in update:
        query_id = update["pre_checkout_query"].get("id")
        if bot_token and query_id:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/answerPreCheckoutQuery",
                        json={"pre_checkout_query_id": query_id, "ok": True},
                    )
            except Exception as e:
                logger.warning(f"Error answering pre_checkout_query: {e}")
        return {"ok": True}

    message = update.get("message", {})
    if not message:
        return {"ok": True}

    chat_id = message.get("chat", {}).get("id")
    from_user = message.get("from", {})
    actual_username = (from_user.get("username") or "").lower()
    first_name = from_user.get("first_name", actual_username or "Cadet")
    user_id = str(from_user.get("id", chat_id or "user"))
    display_name = f"@{actual_username}" if actual_username else first_name
    text = (message.get("text") or "").strip()

    # Determine session token if this was launched from a deep link (/start auth_<sessionToken>)
    session_token = ""
    if "/start auth_" in text:
        parts = text.split("auth_")
        if len(parts) > 1:
            session_token = parts[1].strip()

    # Prioritize session token so web-poll / PIN confirmation match the browser instance
    if session_token:
        user_pin = generate_stateless_pin(session_token)
    elif actual_username:
        user_pin = generate_stateless_pin(actual_username)
    else:
        user_pin = generate_stateless_pin(str(chat_id or user_id))

    # Persist verified identity record
    auth_data = {
        "verified": True,
        "username": actual_username or first_name,
        "first_name": first_name,
        "tg_id": user_id,
        "code": user_pin,
        "sessionToken": session_token or f"sess_{actual_username or chat_id}",
    }

    # Store under all keys for instantaneous multi-container retrieval
    if session_token:
        save_auth_record(session_token, auth_data)
    if actual_username:
        save_auth_record(actual_username, auth_data)
    save_auth_record(user_pin, auth_data)
    save_auth_record(user_id, auth_data)
    if chat_id:
        save_auth_record(str(chat_id), auth_data)

    # Always send response back to user in Telegram!
    if bot_token and chat_id:
        welcome_text = (
            f"⚡ ACCESS GRANTED, Cadet {display_name}!\n\n"
            f"Your Telegram identity is verified for TERMINALTOR.\n\n"
            f"🔑 Your One-Time Security PIN: [ {user_pin} ]\n"
            f"(Valid for 15 minutes)\n\n"
            f"Enter this PIN on the web terminal, or tap below to play directly in Telegram:"
        )

        send_payload = {
            "chat_id": chat_id,
            "text": welcome_text,
            "reply_markup": {
                "inline_keyboard": [
                    [
                        {
                            "text": "🎮 Launch TERMINALTOR",
                            "web_app": {"url": app_url},
                        }
                    ],
                    [
                        {
                            "text": "🌐 Open in Web Browser",
                            "url": app_url,
                        }
                    ],
                ]
            },
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json=send_payload,
                )
                if res.status_code != 200:
                    logger.warning(f"Telegram API responded with {res.status_code}: {res.text}. Falling back to plain text...")
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={
                            "chat_id": chat_id,
                            "text": (
                                f"⚡ ACCESS GRANTED, Cadet {display_name}!\n\n"
                                f"🔑 Your One-Time Security PIN: [ {user_pin} ]\n"
                                f"(Valid for 15 minutes)\n\n"
                                f"Open game: {app_url}"
                            ),
                        },
                    )
        except Exception as e:
            logger.error(f"Error delivering Telegram bot message: {e}")

    return {"ok": True, "verified": True, "pin": user_pin}


@api_v1_router.get("/telegram/bot-status", tags=["telegram"])
async def get_bot_status():
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or "8761897858:AAGpW_aPC02Rg_W4t7Du8Y9SJOETZAVIgm8"
    raw_bot = os.getenv("VITE_TELEGRAM_BOT_USERNAME", "Hqgamebot")
    bot_username = raw_bot.lstrip("@").strip() or "Hqgamebot"
    app_url = normalize_app_url(os.getenv("APP_URL"))

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            me_resp = await client.get(f"https://api.telegram.org/bot{bot_token}/getMe")
            wh_resp = await client.get(f"https://api.telegram.org/bot{bot_token}/getWebhookInfo")
            return {
                "configured": True,
                "bot": me_resp.json().get("result"),
                "webhook": wh_resp.json().get("result"),
                "appUrl": app_url,
            }
    except Exception as e:
        return {"configured": True, "error": str(e), "appUrl": app_url}


@api_v1_router.get("/telegram/setup-webhook", tags=["telegram"])
async def setup_webhook(token: str = "", url: str = ""):
    bot_token = token or os.getenv("TELEGRAM_BOT_TOKEN") or "8761897858:AAGpW_aPC02Rg_W4t7Du8Y9SJOETZAVIgm8"
    app_url = normalize_app_url(url or os.getenv("APP_URL"))

    try:
        webhook_url = f"{app_url}/api/v1/telegram/webhook"
        async with httpx.AsyncClient(timeout=10.0) as client:
            wh_resp = await client.post(
                f"https://api.telegram.org/bot{bot_token}/setWebhook",
                params={"url": webhook_url},
            )
            mb_resp = await client.post(
                f"https://api.telegram.org/bot{bot_token}/setChatMenuButton",
                json={
                    "menu_button": {
                        "type": "web_app",
                        "text": "Play TERMINALTOR 🎮",
                        "web_app": {"url": app_url},
                    }
                },
            )
            return {
                "success": True,
                "webhookUrl": webhook_url,
                "webhookConfigured": wh_resp.json().get("ok"),
                "menuButtonConfigured": mb_resp.json().get("ok"),
                "message": "Telegram Bot successfully linked!",
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


api_v1_router.include_router(challenges_router)
api_v1_router.include_router(execute_router)
