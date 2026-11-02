import asyncio
import unittest

from phase7.game.protocol import Player
from phase7.game.rooms import Room


class MockWebSocket:
    def __init__(self):
        self.sent = []

    async def send_json(self, data):
        self.sent.append(data)

    async def send_text(self, data):
        self.sent.append(data)


class TestWebSocketProtocol(unittest.TestCase):
    def test_both_clients_receive_round_start_and_word_feed(self):
        room = Room(code="SYNC1", mode="wordforge")
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        p1 = Player(id="p1", username="Alice", ws=ws1)
        p2 = Player(id="p2", username="Bob", ws=ws2)

        async def run_scenario():
            # Add p1, then p2
            await room.add_player(p1)
            await room.add_player(p2)

            # Both should have received welcome / joined messages
            self.assertTrue(any(m["type"] == "connected" for m in ws1.sent))
            self.assertTrue(any(m["type"] == "connected" for m in ws2.sent))

            # Simulate word_feed broadcast
            from phase7.game.wordforge.feed import flush_feed
            room.feed_pending.append({"word": "stream", "player": "Alice", "points": 6})
            await flush_feed(room)

            # Both ws1 and ws2 received word_feed
            p1_feeds = [m for m in ws1.sent if m["type"] == "word_feed"]
            p2_feeds = [m for m in ws2.sent if m["type"] == "word_feed"]

            self.assertEqual(len(p1_feeds), 1)
            self.assertEqual(len(p2_feeds), 1)
            self.assertEqual(p1_feeds[0]["words"][0]["word"], "stream")
            self.assertEqual(p2_feeds[0]["words"][0]["word"], "stream")

        asyncio.run(run_scenario())


if __name__ == "__main__":
    unittest.main()
