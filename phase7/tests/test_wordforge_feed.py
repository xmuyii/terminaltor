import asyncio
import time
import unittest
from types import SimpleNamespace

from phase7.game.wordforge.feed import flush_feed, record_word


class MockRoom:
    def __init__(self):
        self.broadcasts = []
        self.feed_pending = []
        self.batch_seq = 0
        self.last_flush_ts = time.monotonic()
        self.state = "playing"

    async def broadcast(self, payload):
        self.broadcasts.append(payload)


class TestWordForgeFeed(unittest.TestCase):
    def test_immediate_flush_on_four_accepted_words(self):
        room = MockRoom()
        player = SimpleNamespace(username="Alice")

        # 3 words -> no flush yet
        asyncio.run(record_word(room, "word1", player, 5))
        asyncio.run(record_word(room, "word2", player, 5))
        asyncio.run(record_word(room, "word3", player, 5))
        self.assertEqual(len(room.broadcasts), 0)
        self.assertEqual(len(room.feed_pending), 3)

        # 4th word -> triggers immediate flush
        asyncio.run(record_word(room, "word4", player, 5))
        self.assertEqual(len(room.broadcasts), 1)
        self.assertEqual(len(room.feed_pending), 0)
        batch = room.broadcasts[0]
        self.assertEqual(batch["type"], "word_feed")
        self.assertEqual(batch["batch_id"], 1)
        self.assertEqual(len(batch["words"]), 4)

    def test_empty_pending_does_not_flush(self):
        room = MockRoom()
        asyncio.run(flush_feed(room))
        self.assertEqual(len(room.broadcasts), 0)

    def test_flush_on_interval_or_manual(self):
        room = MockRoom()
        player = SimpleNamespace(username="Bob")
        asyncio.run(record_word(room, "solo", player, 4))
        self.assertEqual(len(room.feed_pending), 1)
        self.assertEqual(len(room.broadcasts), 0)

        # Manual interval timer trigger
        asyncio.run(flush_feed(room))
        self.assertEqual(len(room.broadcasts), 1)
        self.assertEqual(len(room.feed_pending), 0)
        self.assertEqual(room.broadcasts[0]["words"][0]["word"], "solo")


if __name__ == "__main__":
    unittest.main()
