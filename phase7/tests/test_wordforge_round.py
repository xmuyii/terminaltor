import asyncio
import time
import unittest
from types import SimpleNamespace

from phase7.game.config import game_settings
from phase7.game.wordforge.round import WordForgeRound


class MockRoomForRound:
    def __init__(self, code="TEST1"):
        self.code = code
        self.mode = "wordforge"
        self.state = "waiting"
        self.players = {}
        self.recent_languages = []
        self.round = None
        self.broadcasts = []
        self.found_words = set()
        self.feed_pending = []
        self.batch_seq = 0
        self.last_flush_ts = time.monotonic()

    async def broadcast(self, payload):
        self.broadcasts.append(payload)

    async def send_to(self, player, payload):
        pass

    async def start_intermission(self):
        self.state = "intermission"


class TestWordForgeRound(unittest.TestCase):
    def test_round_initialization_timing_and_counts(self):
        room = MockRoomForRound()
        wf = WordForgeRound(room)
        wf.setup()

        # Assert: 180s round duration configured
        self.assertAlmostEqual(wf.ends_at - wf.starts_at, game_settings.WORDFORGE_ROUND_SECONDS, delta=1.0)
        # Assert: midround at exactly 90s
        self.assertAlmostEqual(wf.midround_at - wf.starts_at, game_settings.WORDFORGE_MIDROUND_AT_SECONDS, delta=1.0)

        # Assert: 2 seed words and 12 letters in pool initially
        self.assertEqual(len(wf.seed_words), 2)
        self.assertEqual(len(wf.pool), 12)

        # Assert: possible_count computed at t=0
        t0_possible = wf.possible_count
        self.assertGreater(t0_possible, 0)

        # Before midround, possible_count does not change
        self.assertEqual(wf.possible_count, t0_possible)

        # Inject midround
        asyncio.run(wf.inject_midround())

        # Assert: 2 letters added to pool (now 14 letters)
        self.assertEqual(len(wf.pool), 14)
        self.assertEqual(len(wf.midround_letters), 2)

        # Assert: pool_update was broadcast
        pool_updates = [b for b in room.broadcasts if b.get("type") == "pool_update"]
        self.assertEqual(len(pool_updates), 1)
        self.assertEqual(len(pool_updates[0]["added_letters"]), 2)
        self.assertEqual(len(pool_updates[0]["pool"]), 14)

        # Assert: possible_count updated at t=90
        t90_possible = wf.possible_count
        self.assertEqual(pool_updates[0]["possible_count"], t90_possible)


if __name__ == "__main__":
    unittest.main()
