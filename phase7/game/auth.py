"""Authentication helpers for Arcade WebSocket connections."""
import json
import uuid
from typing import Any, Dict, Optional
import jwt

from phase7.game.config import game_settings


def verify_token(token: Optional[str]) -> Dict[str, Any]:
    """
    Verifies JWT token. If valid, extracts user_id, username, avatar_url.
    If absent or invalid, returns an anonymous player payload for local play.
    """
    if not token:
        guest_id = f"guest_{uuid.uuid4().hex[:8]}"
        return {
            "id": guest_id,
            "username": f"Player_{guest_id[-4:]}",
            "avatar_url": "",
            "is_guest": True,
        }

    try:
        payload = jwt.decode(
            token,
            game_settings.GAME_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
        return {
            "id": payload.get("sub", payload.get("user_id", str(uuid.uuid4()))),
            "username": payload.get("username", payload.get("email", "Player")),
            "avatar_url": payload.get("avatar_url", ""),
            "is_guest": False,
        }
    except Exception:
        # Fallback guest
        guest_id = f"guest_{uuid.uuid4().hex[:8]}"
        return {
            "id": guest_id,
            "username": f"Player_{guest_id[-4:]}",
            "avatar_url": "",
            "is_guest": True,
        }
