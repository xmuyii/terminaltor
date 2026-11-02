"""Word feed batch flusher for Word Forge (4 words or 15 seconds)."""
import asyncio
import time
from typing import Any, Dict, List

from phase7.game.config import game_settings
from phase7.game.protocol import make_word_feed


async def flush_feed(room: Any) -> None:
    """
    Flushes pending words to all players in the room in a single batch card.
    Empty batches are not sent.
    """
    if not hasattr(room, "feed_pending") or not room.feed_pending:
        return

    room.batch_seq = getattr(room, "batch_seq", 0) + 1
    batch_words = list(room.feed_pending)
    room.feed_pending = []
    room.last_flush_ts = time.monotonic()

    batch_payload = make_word_feed(batch_id=room.batch_seq, words=batch_words)
    if hasattr(room, "broadcast"):
        await room.broadcast(batch_payload)


async def record_word(room: Any, word: str, player: Any, points: int) -> None:
    """Records an accepted word into feed_pending and flushes immediately if batch size is reached."""
    if not hasattr(room, "feed_pending") or room.feed_pending is None:
        room.feed_pending = []

    room.feed_pending.append({
        "word": word,
        "player": getattr(player, "username", "Player"),
        "points": points,
        "at": int(time.time() * 1000),
    })

    if len(room.feed_pending) >= game_settings.WORDFORGE_FEED_BATCH_SIZE:
        await flush_feed(room)


async def start_feed_timer(room: Any) -> None:
    """Background periodic task flushing the feed every WORDFORGE_FEED_BATCH_INTERVAL_MS."""
    interval_sec = game_settings.WORDFORGE_FEED_BATCH_INTERVAL_MS / 1000.0
    while getattr(room, "state", "") == "playing":
        await asyncio.sleep(interval_sec)
        if getattr(room, "state", "") != "playing":
            break
        if hasattr(room, "feed_pending") and room.feed_pending:
            await flush_feed(room)
