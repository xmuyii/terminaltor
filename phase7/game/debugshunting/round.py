"""Debugs Hunting round execution and question scheduler."""
import asyncio
import random
import time
from typing import Any, Dict, List, Optional, Tuple

from phase7.game.config import game_settings
from phase7.game.debugshunting.questions import LANGUAGES, question_bank
from phase7.game.debugshunting.scoring import score_answers
from phase7.game.protocol import (
    make_answer_revealed,
    make_debugshunting_round_start,
    make_question,
    make_round_end,
)


class DebugsHuntingRound:
    def __init__(self, room: Any) -> None:
        self.room = room
        self.language: str = "python"
        self.questions: List[Dict[str, Any]] = []
        self.current: Optional[Dict[str, Any]] = None
        self.starts_at: float = 0.0
        self._task: Optional[asyncio.Task] = None

    def setup(self) -> None:
        # Rotate language
        recent = getattr(self.room, "recent_languages", [])
        candidates = [l for l in LANGUAGES if not (recent and recent[-1] == l)]
        if not candidates:
            candidates = list(LANGUAGES)
        self.language = random.choice(candidates)
        self.room.recent_languages = (recent + [self.language])[-3:]

        count = game_settings.DEBUGSHUNTING_QUESTIONS_PER_ROUND
        self.questions = question_bank.get_questions(self.language, count=count)
        self.starts_at = time.time()

    async def start(self) -> None:
        self.setup()
        self.room.round = self
        self.room.state = "playing"

        # Reset player scores
        for p in self.room.players.values():
            p.score = 0

        # Broadcast round start without question count
        start_payload = make_debugshunting_round_start(
            language=self.language,
            starts_at=self.starts_at,
        )
        await self.room.broadcast(start_payload)

        self._task = asyncio.create_task(self._run_questions())

    async def _run_questions(self) -> None:
        try:
            for q in self.questions:
                if self.room.state != "playing":
                    break
                await self._ask(q)
                # 1.5s pause after reveal before next question
                await asyncio.sleep(game_settings.DEBUGSHUNTING_REVEAL_PAUSE_MS / 1000.0)

            if self.room.state == "playing":
                await self.finish()

        except asyncio.CancelledError:
            pass

    async def _ask(self, q: Dict[str, Any]) -> None:
        timeout_sec = game_settings.DEBUGSHUNTING_QUESTION_SECONDS
        ends_at = time.time() + timeout_sec
        monotonic_start = time.monotonic()
        resolve = asyncio.Event()

        self.current = {
            "question": q,
            "ends_at": ends_at,
            "monotonic_start": monotonic_start,
            "resolve": resolve,
            "answers": {},          # player_id -> (chosen_index, elapsed_sec)
            "fastest": None,
            "correct_count": 0,
        }

        # Broadcast question (no question index or total!)
        q_payload = make_question(
            question_id=q.get("id", ""),
            text=q["text"],
            options=q["options"],
            ends_at=ends_at,
        )
        await self.room.broadcast(q_payload)

        # Wait for either fastest correct answer or 10s timeout
        try:
            await asyncio.wait_for(resolve.wait(), timeout=timeout_sec)
        except asyncio.TimeoutError:
            pass

        # Calculate scores
        results = score_answers(
            answers=self.current["answers"],
            correct_index=q["correct_index"],
        )

        # Update player running scores
        for pid, res in results.items():
            if pid in self.room.players:
                self.room.players[pid].score += res["points"]

        # Reveal answer
        reveal_payload = make_answer_revealed(
            correct_index=q["correct_index"],
            fastest_player_id=self.current["fastest"],
            results=results,
        )
        await self.room.broadcast(reveal_payload)
        self.current = None

    def submit_answer(self, player: Any, idx: int) -> None:
        if self.current is None:
            return
        # Reject if already submitted for this question (rate limit)
        if player.id in self.current["answers"]:
            return
        # Reject if after ends_at
        if time.time() > self.current["ends_at"]:
            return

        elapsed = time.monotonic() - self.current["monotonic_start"]
        self.current["answers"][player.id] = (idx, elapsed)

        # If answer is correct
        if idx == self.current["question"]["correct_index"]:
            self.current["correct_count"] += 1
            if self.current["fastest"] is None:
                self.current["fastest"] = player.id
                # End question early on first correct answer
                self.current["resolve"].set()

    async def finish(self) -> None:
        self.room.state = "scoring"

        all_participants = {**getattr(self.room, "scored_history", {}), **self.room.players}
        scores = []
        for p in all_participants.values():
            scores.append({
                "user_id": p.id,
                "username": p.username,
                "score": p.score,
            })
        scores.sort(key=lambda x: x["score"], reverse=True)

        details = {
            "mode": "debugshunting",
            "language": self.language,
            "total_questions": len(self.questions),
        }

        # Persist results
        from phase7.game.persistence import persistence
        await persistence.save_round(
            mode="debugshunting",
            room_code=self.room.code,
            language=self.language,
            metadata=details,
            started_at=self.starts_at,
            ended_at=time.time(),
            player_results=[
                {
                    "user_id": s["user_id"],
                    "score": s["score"],
                    "detail": {},
                }
                for s in scores if s["user_id"] in all_participants
            ],
        )

        # Broadcast round end
        end_payload = make_round_end(scores=scores, details=details)
        await self.room.broadcast(end_payload)

        # Trigger intermission
        await self.room.start_intermission()
