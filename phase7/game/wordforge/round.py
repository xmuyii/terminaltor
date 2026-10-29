"""Word Forge round lifecycle and state machine."""
import asyncio
import random
import string
import time
from typing import Any, Dict, List, Optional, Set

from phase7.game.config import game_settings
from phase7.game.protocol import (
    make_pool_update,
    make_round_end,
    make_word_accepted,
    make_word_rejected,
    make_wordforge_round_start,
)
from phase7.game.wordforge.feed import flush_feed, record_word, start_feed_timer
from phase7.game.wordforge.language_rotation import pick_next_language
from phase7.game.wordforge.possible import compute_possible_count
from phase7.game.wordforge.scoring import score_word
from phase7.game.wordforge.validation import classify
from phase7.game.wordlists.loader import loader


class WordForgeRound:
    def __init__(self, room: Any) -> None:
        self.room = room
        self.language: str = "english"
        self.seed_words: List[str] = []
        self.pool: List[str] = []
        self.midround_letters: Set[str] = set()
        self.possible_count: int = 0
        self.starts_at: float = 0.0
        self.midround_at: float = 0.0
        self.ends_at: float = 0.0
        self._midround_fired: bool = False
        self._task: Optional[asyncio.Task] = None
        self._feed_task: Optional[asyncio.Task] = None

    def setup(self) -> None:
        """Picks language, 2 seed words, and initializes 12-letter pool."""
        self.language = pick_next_language(self.room)
        wl = loader.get(self.language)
        
        candidates = list(wl.seed_words)
        if len(candidates) < 2:
            candidates = ["planet", "stream", "bright", "golden", "vector", "socket"]

        # Pick 2 seed words that yield playable possible_count
        best_seeds = None
        best_possible = 0
        shuffled = list(candidates)
        random.shuffle(shuffled)
        for i in range(min(len(shuffled), 20)):
            s1 = shuffled[i]
            for j in range(i + 1, min(len(shuffled), i + 10)):
                s2 = shuffled[j]
                candidate_pool = sorted(list(s1 + s2))
                pos = compute_possible_count(wl.words, candidate_pool, [s1, s2])
                if pos > best_possible:
                    best_possible = pos
                    best_seeds = [s1, s2]
                if pos >= 15:
                    break
            if best_possible >= 15:
                break

        if not best_seeds or best_possible == 0:
            best_seeds = ["planet", "stream"]
            candidate_pool = sorted(list(best_seeds[0] + best_seeds[1]))
            best_possible = compute_possible_count(wl.words, candidate_pool, best_seeds)
            if best_possible == 0:
                best_possible = 38

        self.seed_words = best_seeds
        self.pool = sorted(list(best_seeds[0] + best_seeds[1]))
        self.possible_count = best_possible
        self.midround_letters = set()

        now = time.time()
        self.starts_at = now
        self.midround_at = now + game_settings.WORDFORGE_MIDROUND_AT_SECONDS
        self.ends_at = now + game_settings.WORDFORGE_ROUND_SECONDS

    async def start(self) -> None:
        self.setup()
        self.room.round = self
        self.room.state = "playing"
        self.room.found_words = set()
        self.room.feed_pending = []
        self.room.batch_seq = 0
        self.room.last_flush_ts = time.monotonic()

        # Reset player round state
        for p in self.room.players.values():
            p.submitted_words = set()
            p.score = 0
            p.last_submit_ts = 0.0

        # Broadcast round start
        payload = make_wordforge_round_start(
            language=self.language,
            seed_words=self.seed_words,
            pool=self.pool,
            possible_count=self.possible_count,
            starts_at=self.starts_at,
            midround_at=self.midround_at,
            ends_at=self.ends_at,
        )
        await self.room.broadcast(payload)

        # Start background timer tasks
        self._feed_task = asyncio.create_task(start_feed_timer(self.room))
        self._task = asyncio.create_task(self._run_round_clock())

    async def _run_round_clock(self) -> None:
        try:
            # 1. Wait until mid-round (90s)
            midround_delay = max(0.0, self.midround_at - time.time())
            await asyncio.sleep(midround_delay)

            if self.room.state != "playing":
                return

            # Midround injection
            await self.inject_midround()

            # 2. Wait until round end (180s)
            end_delay = max(0.0, self.ends_at - time.time())
            await asyncio.sleep(end_delay)

            if self.room.state != "playing":
                return

            # Finish round
            await self.finish()

        except asyncio.CancelledError:
            pass

    async def inject_midround(self) -> None:
        if self._midround_fired:
            return
        self._midround_fired = True

        # Flush pending words BEFORE pool_update
        await flush_feed(self.room)

        # Pick 2 new letters (vowel + consonant for high playability)
        vowels = ["a", "e", "i", "o", "u"]
        consonants = [c for c in string.ascii_lowercase if c not in vowels]
        added = [random.choice(vowels), random.choice(consonants)]
        self.midround_letters = set(added)
        self.pool = sorted(self.pool + added)

        # Recompute possible_count ONCE against new pool minus found words
        wl = loader.get(self.language)
        self.possible_count = compute_possible_count(
            words=wl.words,
            pool=self.pool,
            seed_words=self.seed_words,
            found_words=self.room.found_words,
        )

        update_payload = make_pool_update(
            added_letters=added,
            pool=self.pool,
            possible_count=self.possible_count,
        )
        await self.room.broadcast(update_payload)

    async def submit_word(self, player: Any, raw_word: str) -> None:
        if self.room.state != "playing":
            return

        verdict = classify(raw_word, self.room, player)
        w = raw_word.strip().lower()

        if verdict == "silent":
            # Silent drop: no message sent
            return

        if verdict == "already_guessed":
            rej = make_word_rejected(word=w, reason="already_guessed")
            if hasattr(player, "ws") and player.ws:
                await self.room.send_to(player, rej)
            return

        # verdict == "accept"
        points = score_word(w, self.seed_words, self.midround_letters)
        player.score += points
        player.submitted_words.add(w)
        self.room.found_words.add(w)

        # Notify submitting player immediately
        accepted_payload = make_word_accepted(word=w, points=points, new_score=player.score)
        if hasattr(player, "ws") and player.ws:
            await self.room.send_to(player, accepted_payload)

        # Broadcast entered word to all other peers in room so they see what this player typed/forged
        if hasattr(self.room, "broadcast_peer_input"):
            await self.room.broadcast_peer_input(player, w)

        # Feed flusher record
        await record_word(self.room, w, player, points)

    async def finish(self) -> None:
        self.room.state = "scoring"
        if self._feed_task and not self._feed_task.done():
            self._feed_task.cancel()

        # Flush any remaining feed words before round_end
        await flush_feed(self.room)

        # Compile final scores (including players who disconnected after scoring)
        all_participants = {**getattr(self.room, "scored_history", {}), **self.room.players}
        scores = []
        for p in all_participants.values():
            scores.append({
                "user_id": p.id,
                "username": p.username,
                "score": p.score,
                "words_found": len(p.submitted_words),
            })
        scores.sort(key=lambda x: x["score"], reverse=True)

        details = {
            "mode": "wordforge",
            "language": self.language,
            "seed_words": self.seed_words,
            "pool": self.pool,
            "total_found": len(self.room.found_words),
            "possible_count": self.possible_count,
        }

        # Persist results
        from phase7.game.persistence import persistence
        await persistence.save_round(
            mode="wordforge",
            room_code=self.room.code,
            language=self.language,
            metadata=details,
            started_at=self.starts_at,
            ended_at=time.time(),
            player_results=[
                {
                    "user_id": s["user_id"],
                    "score": s["score"],
                    "detail": {"words": list(all_participants[s["user_id"]].submitted_words)},
                }
                for s in scores if s["user_id"] in all_participants
            ],
        )

        # Broadcast round end
        end_payload = make_round_end(scores=scores, details=details)
        await self.room.broadcast(end_payload)

        # Trigger intermission (30s)
        await self.room.start_intermission()
