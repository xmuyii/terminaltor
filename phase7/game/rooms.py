"""Multiplayer Room registry and continuous ALIVE / DORMANT lifecycle engine."""
import asyncio
import json
import time
from typing import Any, Dict, List, Literal, Optional, Set

from phase7.game.config import game_settings
from phase7.game.debugshunting.round import DebugsHuntingRound
from phase7.game.protocol import (
    Player,
    make_connected,
    make_intermission,
    make_player_joined,
    make_player_left,
)
from phase7.game.wordforge.round import WordForgeRound


class Room:
    def __init__(self, code: str, mode: Literal["wordforge", "debugshunting"] = "wordforge") -> None:
        self.code: str = code
        self.mode: Literal["wordforge", "debugshunting"] = mode
        self.state: Literal["seeding", "playing", "scoring", "intermission"] = "seeding"
        self.players: Dict[str, Player] = {}
        # Retains disconnected players who scored this round for round-end persistence
        self.scored_history: Dict[str, Player] = {}
        self.task: Optional[asyncio.Task] = None
        self.round: Any = None
        self.recent_languages: List[str] = []
        
        # Word Forge specific state
        self.found_words: Set[str] = set()
        self.feed_pending: List[Dict[str, Any]] = []
        self.batch_seq: int = 0
        self.last_flush_ts: float = time.monotonic()

        # Lifecycle synchronization
        self.wake_event: asyncio.Event = asyncio.Event()
        self.dormant_since: Optional[float] = None
        self.intermission_ends_at: float = 0.0
        self.is_destroyed: bool = False

    async def add_player(self, player: Player) -> bool:
        if len(self.players) >= game_settings.GAME_MAX_PLAYERS_PER_ROOM:
            return False

        self.players[player.id] = player
        self.dormant_since = None
        self.wake_event.set()

        # Send initial connected state
        player_list = [p.to_dict() for p in self.players.values()]
        welcome = make_connected(
            player_id=player.id,
            room_code=self.code,
            mode=self.mode,
            players=player_list,
        )
        await self.send_to(player, welcome)

        # Notify peers
        joined_msg = make_player_joined(player=player.to_dict())
        for pid, p in self.players.items():
            if pid != player.id:
                await self.send_to(p, joined_msg)

        # On WebSocket connect:
        # room.wake_event.set() unblocks wait_for_players if DORMANT
        self.wake_event.set()

        # If in seeding or waiting state, start round immediately
        if self.state in ("seeding", "waiting"):
            await self.start_new_round()
        elif self.state == "playing" and self.round:
            if self.mode == "wordforge":
                from phase7.game.protocol import make_wordforge_round_start
                snapshot = make_wordforge_round_start(
                    language=self.round.language,
                    seed_words=self.round.seed_words,
                    pool=self.round.pool,
                    possible_count=self.round.possible_count,
                    starts_at=self.round.starts_at,
                    midround_at=self.round.midround_at,
                    ends_at=self.round.ends_at,
                )
                await self.send_to(player, snapshot)
            elif self.mode == "debugshunting":
                from phase7.game.protocol import make_debugshunting_round_start, make_question
                snapshot = make_debugshunting_round_start(
                    language=self.round.language,
                    starts_at=self.round.starts_at,
                )
                await self.send_to(player, snapshot)
                if getattr(self.round, "current", None):
                    cur_q = self.round.current["question"]
                    q_snap = make_question(
                        question_id=cur_q.get("id", ""),
                        text=cur_q["text"],
                        options=cur_q["options"],
                        ends_at=self.round.current["ends_at"],
                    )
                    await self.send_to(player, q_snap)

        elif self.state == "intermission":
            snap_inter = make_intermission(next_round_at=self.intermission_ends_at)
            await self.send_to(player, snap_inter)

        return True

    async def remove_player(self, player_id: str) -> None:
        if player_id in self.players:
            leaving = self.players.pop(player_id)
            # If the player scored at least once this round, retain for persistence
            if leaving.score > 0 or len(leaving.submitted_words) > 0:
                self.scored_history[leaving.id] = leaving

            left_msg = make_player_left(player_id=player_id)
            await self.broadcast(left_msg)

    async def send_to(self, player: Player, payload: Dict[str, Any]) -> None:
        if player.ws:
            try:
                if hasattr(player.ws, "send_json"):
                    await player.ws.send_json(payload)
                elif hasattr(player.ws, "send_text"):
                    await player.ws.send_text(json.dumps(payload))
                elif hasattr(player.ws, "send"):
                    await player.ws.send(json.dumps(payload))
            except Exception:
                pass

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        tasks = [self.send_to(p, payload) for p in list(self.players.values())]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def start_new_round(self) -> None:
        if self.mode == "wordforge":
            self.round = WordForgeRound(self)
        else:
            self.round = DebugsHuntingRound(self)
        await self.round.start()

    async def start_intermission(self) -> None:
        await broadcast_intermission(self)

    async def broadcast_peer_input(self, player: Player, text: str) -> None:
        """Broadcasts live typing input to peers in the room."""
        msg = {
            "type": "peer_input",
            "player_id": player.id,
            "username": player.username,
            "text": text,
        }
        for pid, p in self.players.items():
            if pid != player.id:
                await self.send_to(p, msg)


async def wait_for_players(room: Room) -> bool:
    """Blocks while room is DORMANT (0 players). Destroys room after 60s grace timeout."""
    if room.players:
        return True

    room.dormant_since = time.monotonic()
    room.wake_event.clear()

    while True:
        try:
            await asyncio.wait_for(
                room.wake_event.wait(),
                timeout=float(game_settings.GAME_ROOM_DORMANT_GRACE_SECONDS),
            )
            room.dormant_since = None
            return True
        except asyncio.TimeoutError:
            if not room.players:
                await destroy_room(room)
                return False
            return True


async def start_round(room: Room) -> None:
    room.state = "seeding"
    if room.mode == "wordforge":
        room.round = WordForgeRound(room)
    else:
        room.round = DebugsHuntingRound(room)


async def play_round(room: Room) -> None:
    if room.round:
        await room.round.start()
        # Wait for round clock to complete
        if hasattr(room.round, "_task") and room.round._task:
            try:
                await room.round._task
            except asyncio.CancelledError:
                pass


async def score_round(room: Room) -> None:
    room.state = "scoring"
    # Ensure scores include both currently connected players and players who scored before disconnecting
    all_scored: Dict[str, Player] = {**room.scored_history, **room.players}
    if room.round and hasattr(room.round, "finish"):
        pass  # round.finish already persits and broadcasts


async def broadcast_intermission(room: Room) -> None:
    room.state = "intermission"
    duration = game_settings.GAME_INTERMISSION_SECONDS
    room.intermission_ends_at = time.time() + duration
    payload = make_intermission(next_round_at=room.intermission_ends_at)
    await room.broadcast(payload)


async def run_room(room: Room) -> None:
    """Continuous round loop running while room is ALIVE."""
    try:
        while not room.is_destroyed:
            has_players = await wait_for_players(room)
            if not has_players or room.is_destroyed:
                break

            if room.wake_event.is_set():
                room.wake_event.clear()

            await start_round(room)
            await play_round(room)
            await score_round(room)
            await broadcast_intermission(room)
            await asyncio.sleep(game_settings.GAME_INTERMISSION_SECONDS)
    except asyncio.CancelledError:
        pass


async def destroy_room(room: Room) -> None:
    room.is_destroyed = True
    if room.task and not room.task.done():
        room.task.cancel()
    if room.round:
        if getattr(room.round, "_task", None) and not room.round._task.done():
            room.round._task.cancel()
        if getattr(room.round, "_feed_task", None) and not room.round._feed_task.done():
            room.round._feed_task.cancel()
    if hasattr(room, "manager") and room.manager:
        room.manager.remove_room(room.code)
    room_manager.remove_room(room.code)


class RoomManager:
    def __init__(self) -> None:
        self.rooms: Dict[str, Room] = {}

    def get_or_create(self, code: str, mode: Literal["wordforge", "debugshunting"] = "wordforge") -> Room:
        code_clean = code.strip().upper()
        if code_clean not in self.rooms:
            room = Room(code=code_clean, mode=mode)
            room.manager = self
            try:
                loop = asyncio.get_running_loop()
                room.task = loop.create_task(run_room(room))
            except RuntimeError:
                pass
            self.rooms[code_clean] = room
        return self.rooms[code_clean]

    def remove_room(self, code: str) -> None:
        code_clean = code.strip().upper()
        if code_clean in self.rooms:
            del self.rooms[code_clean]


room_manager = RoomManager()
