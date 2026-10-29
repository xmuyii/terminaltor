"""Server-side Word Forge word validation and silent drop rules."""
import time
from collections import Counter
from typing import Any, Counter as CounterType, Union

from phase7.game.config import game_settings
from phase7.game.wordlists.loader import loader


def formable_from_pool(word: str, pool: Union[CounterType[str], list, str]) -> bool:
    if not isinstance(pool, Counter):
        pool = Counter(pool)
    return Counter(word) <= pool


def classify(word: str, room: Any, player: Any) -> str:
    """
    Returns one of:
      'accept'           — valid word, score it
      'already_guessed'  — send explicit rejection to player
      'silent'           — drop, send nothing
    """
    w = word.strip().lower()

    # Rule 8: If len(word) < 4 -> silent drop
    if not w or len(w) < 4:
        return "silent"

    # Rule 2: Rate limit: max 1 submission per 400ms per player -> silent drop
    now = time.monotonic()
    limit_sec = game_settings.WORDFORGE_SUBMIT_RATE_LIMIT_MS / 1000.0
    if hasattr(player, "last_submit_ts") and player.last_submit_ts > 0:
        if (now - player.last_submit_ts) < limit_sec:
            return "silent"
    player.last_submit_ts = now

    # Rule 3 & 4: If word already submitted by self or anyone in the room
    if hasattr(player, "submitted_words") and w in player.submitted_words:
        return "already_guessed"

    if hasattr(room, "found_words") and w in room.found_words:
        return "already_guessed"

    # Rule 7: If word in seed_words -> silent drop
    seed_words = []
    if hasattr(room, "round") and room.round:
        seed_words = getattr(room.round, "seed_words", [])
    if w in seed_words:
        return "silent"

    # Rule 5: If word NOT in language wordlist -> silent drop
    language = "english"
    if hasattr(room, "round") and room.round:
        language = getattr(room.round, "language", "english")
    wl = loader.get(language)
    if w not in wl.words:
        return "silent"

    # Rule 6: If word NOT formable from current pool -> silent drop
    current_pool = []
    if hasattr(room, "round") and room.round:
        current_pool = getattr(room.round, "pool", [])
    if not formable_from_pool(w, current_pool):
        return "silent"

    return "accept"
