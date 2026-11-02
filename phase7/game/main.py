"""FastAPI Arcade Game Service Entry Point."""
import json
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from phase7.game.auth import verify_token
from phase7.game.config import game_settings
from phase7.game.protocol import Player
from phase7.game.rooms import room_manager
from phase7.game.wordlists.loader import loader
from phase7.game.debugshunting.questions import question_bank


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload wordlists and questions at boot
    loader.load_all()
    question_bank.load_all()
    yield


app = FastAPI(
    title="Sovereign Academy Arcade Game Service",
    description="Real-time WebSocket multiplayer engine for Word Forge & Debugs Hunting",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "arcade",
        "rooms_active": len(room_manager.rooms),
    }


@app.get("/rooms")
async def list_rooms():
    return {
        "rooms": [
            {
                "code": r.code,
                "mode": r.mode,
                "state": r.state,
                "players": len(r.players),
            }
            for r in room_manager.rooms.values()
        ]
    }


@app.websocket("/ws/{room_code}")
async def websocket_arcade_endpoint(
    websocket: WebSocket,
    room_code: str,
    token: Optional[str] = Query(None),
    mode: str = Query("wordforge"),
    username: Optional[str] = Query(None),
):
    await websocket.accept()

    # 1. Authenticate player from JWT or guest fallback
    user_info = verify_token(token)
    chosen_username = username or user_info.get("username", "Player")
    player = Player(
        id=user_info["id"],
        username=chosen_username,
        avatar_url=user_info.get("avatar_url", ""),
        ws=websocket,
    )

    # 2. Get or create room
    room = room_manager.get_or_create(room_code, mode=mode)

    # 3. Add player to room
    joined = await room.add_player(player)
    if not joined:
        await websocket.send_json({"type": "error", "code": "ROOM_FULL", "message": "Room is full (max 8 players)"})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                continue

            msg_type = msg.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "submit_word":
                raw_word = msg.get("word", "")
                if hasattr(room, "round") and room.round and hasattr(room.round, "submit_word"):
                    await room.round.submit_word(player, raw_word)

            elif msg_type == "peer_input":
                txt = msg.get("text", "")
                await room.broadcast_peer_input(player, str(txt))

            elif msg_type == "submit_answer":
                idx = msg.get("index")
                if idx is not None and hasattr(room, "round") and room.round and hasattr(room.round, "submit_answer"):
                    room.round.submit_answer(player, int(idx))

    except WebSocketDisconnect:
        await room.remove_player(player.id)
    except Exception:
        await room.remove_player(player.id)
