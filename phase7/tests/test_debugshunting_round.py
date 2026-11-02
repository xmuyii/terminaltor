import asyncio
import time
import unittest
from types import SimpleNamespace

from phase7.game.debugshunting.round import DebugsHuntingRound


class MockRoomForDebugs:
    def __init__(self, code="DEBUGS1"):
        self.code = code
        self.mode = "debugshunting"
        self.state = "waiting"
        self.players = {
            "p1": SimpleNamespace(id="p1", username="Alice", score=0),
            "p2": SimpleNamespace(id="p2", username="Bob", score=0),
        }
        self.recent_languages = []
        self.round = None
        self.broadcasts = []

    async def broadcast(self, payload):
        self.broadcasts.append(payload)

    async def start_intermission(self):
        self.state = "intermission"


class TestDebugsHuntingRound(unittest.TestCase):
    def test_no_question_count_in_messages(self):
        room = MockRoomForDebugs()
        dh = DebugsHuntingRound(room)
        dh.setup()

        # Check round_start payload shape
        from phase7.game.protocol import make_debugshunting_round_start, make_question, make_answer_revealed
        start_payload = make_debugshunting_round_start("python", time.time())
        self.assertNotIn("question_count", start_payload)
        self.assertNotIn("total_questions", start_payload)
        self.assertNotIn("total", start_payload)

        # Check question payload shape
        q_payload = make_question("q1", "What is GIL?", ["A", "B", "C", "D"], time.time() + 10)
        self.assertNotIn("question_index", q_payload)
        self.assertNotIn("index", q_payload)
        self.assertNotIn("total", q_payload)
        self.assertNotIn("ordinal", q_payload)

        # Check reveal payload shape
        rev_payload = make_answer_revealed(1, "p1", {})
        self.assertNotIn("question_index", rev_payload)
        self.assertNotIn("total", rev_payload)

    def test_fastest_correct_answer_triggers_early_resolution(self):
        room = MockRoomForDebugs()
        dh = DebugsHuntingRound(room)
        dh.setup()

        q = {
            "id": "q-test",
            "text": "Sample question",
            "options": ["Opt 0", "Opt 1", "Opt 2", "Opt 3"],
            "correct_index": 2,
        }

        async def run_test():
            ask_task = asyncio.create_task(dh._ask(q))
            # Yield control so _ask starts waiting
            await asyncio.sleep(0.01)

            # Player 1 submits correct answer immediately
            dh.submit_answer(room.players["p1"], 2)

            # Wait for _ask to complete
            await ask_task

            # Check that answer_revealed was broadcast
            reveals = [b for b in room.broadcasts if b["type"] == "answer_revealed"]
            self.assertEqual(len(reveals), 1)
            self.assertEqual(reveals[0]["correct_index"], 2)
            self.assertEqual(reveals[0]["fastest_player_id"], "p1")
            # p1 gets 100 points
            self.assertEqual(room.players["p1"].score, 100)

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
