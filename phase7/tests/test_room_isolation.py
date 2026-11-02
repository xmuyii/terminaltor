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


class TestRoomIsolation(unittest.TestCase):
    def test_two_rooms_isolate_state_completely(self):
        async def run_scenario():
            room1 = Room("ROOM_ALPHA", mode="wordforge")
            room2 = Room("ROOM_BETA", mode="wordforge")

            ws1 = MockWebSocket()
            ws2 = MockWebSocket()

            p1 = Player(id="user_1", username="Alice", ws=ws1)
            p2 = Player(id="user_2", username="Bob", ws=ws2)

            await room1.add_player(p1)
            await room2.add_player(p2)

            self.assertEqual(len(room1.players), 1)
            self.assertEqual(len(room2.players), 1)
            self.assertIn("user_1", room1.players)
            self.assertNotIn("user_1", room2.players)
            self.assertIn("user_2", room2.players)
            self.assertNotIn("user_2", room1.players)

            # Check that found_words in room1 do not bleed into room2
            room1.found_words.add("galaxy")
            self.assertIn("galaxy", room1.found_words)
            self.assertNotIn("galaxy", room2.found_words)

            # Check independent batch_seq and feed_pending
            room1.feed_pending.append({"word": "galaxy", "player": "Alice", "points": 10})
            self.assertEqual(len(room1.feed_pending), 1)
            self.assertEqual(len(room2.feed_pending), 0)

        asyncio.run(run_scenario())


if __name__ == "__main__":
    unittest.main()
