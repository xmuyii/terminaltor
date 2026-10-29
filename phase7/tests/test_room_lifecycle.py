import asyncio
import time
import unittest

from phase7.game.config import game_settings
from phase7.game.protocol import Player
from phase7.game.rooms import Room, RoomManager, destroy_room, wait_for_players


class MockWebSocket:
    def __init__(self):
        self.sent = []

    async def send_json(self, data):
        self.sent.append(data)

    async def send_text(self, data):
        self.sent.append(data)


class TestRoomLifecycle(unittest.TestCase):
    def test_room_with_single_player_starts_immediately_and_runs(self):
        room = Room(code="SOLO1", mode="wordforge")
        ws = MockWebSocket()
        p1 = Player(id="p1", username="SoloCoder", ws=ws)

        async def run_test():
            joined = await room.add_player(p1)
            self.assertTrue(joined)
            self.assertEqual(len(room.players), 1)

            # Round starts immediately without waiting
            self.assertEqual(room.state, "playing")
            self.assertIsNotNone(room.round)

            # Fix language, seed words and pool for deterministic submission
            room.round.language = "english"
            room.round.seed_words = ["planet", "stream"]
            room.round.pool = sorted(list("planetstream"))

            # Player can submit word
            await room.round.submit_word(p1, "plate")
            # Score awarded
            self.assertGreater(p1.score, 0)

            # Round runs to completion and enters intermission
            await room.round.finish()
            self.assertIn(room.state, ("scoring", "intermission"))

        asyncio.run(run_test())

    def test_mid_round_join_receives_current_state_and_can_submit(self):
        room = Room(code="MID1", mode="wordforge")
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()
        p1 = Player(id="p1", username="Alice", ws=ws1)
        p2 = Player(id="p2", username="Bob", ws=ws2)

        async def run_test():
            await room.add_player(p1)
            self.assertEqual(room.state, "playing")
            round_obj = room.round
            round_obj.language = "english"
            round_obj.seed_words = ["planet", "stream"]
            round_obj.pool = sorted(list("planetstream"))

            # Second player joins mid-round
            await room.add_player(p2)

            # p2 received connected + round snapshot
            p2_starts = [m for m in ws2.sent if m["type"] == "round_start"]
            self.assertEqual(len(p2_starts), 1)
            self.assertEqual(p2_starts[0]["pool"], round_obj.pool)
            self.assertEqual(p2_starts[0]["possible_count"], round_obj.possible_count)

            # Both players can submit words
            await round_obj.submit_word(p2, "metal")
            self.assertIn("metal", room.found_words)

        asyncio.run(run_test())

    def test_last_player_leaves_dormant_and_rejoins_within_grace(self):
        room = Room(code="DORM1", mode="wordforge")
        ws1 = MockWebSocket()
        p1 = Player(id="p1", username="Alice", ws=ws1)

        async def run_test():
            await room.add_player(p1)
            self.assertIsNone(room.dormant_since)

            # Last player leaves -> room becomes dormant
            await room.remove_player("p1")
            self.assertEqual(len(room.players), 0)

            # wait_for_players blocks while dormant
            wait_task = asyncio.create_task(wait_for_players(room))
            await asyncio.sleep(0.01)
            self.assertIsNotNone(room.dormant_since)

            # Player rejoins within grace period
            p2 = Player(id="p2", username="Bob", ws=MockWebSocket())
            await room.add_player(p2)

            # wait_task resumes and unblocks
            res = await wait_task
            self.assertTrue(res)
            self.assertIsNone(room.dormant_since)

        asyncio.run(run_test())

    def test_dormant_timeout_destroys_room(self):
        async def run_test():
            rm = RoomManager()
            room = rm.get_or_create("DEAD1", mode="wordforge")
            self.assertIn("DEAD1", rm.rooms)

            # Temporarily shorten grace period for unit test
            original_timeout = game_settings.GAME_ROOM_DORMANT_GRACE_SECONDS
            game_settings.GAME_ROOM_DORMANT_GRACE_SECONDS = 0.05
            try:
                # Wait for players times out because 0 players ever joined
                has_players = await wait_for_players(room)
                self.assertFalse(has_players)
                self.assertTrue(room.is_destroyed)
                self.assertNotIn("DEAD1", rm.rooms)
            finally:
                game_settings.GAME_ROOM_DORMANT_GRACE_SECONDS = original_timeout

        asyncio.run(run_test())

    def test_player_leaves_mid_round_score_persisted_at_round_end(self):
        room = Room(code="PERSIST1", mode="wordforge")
        ws = MockWebSocket()
        p1 = Player(id="p1", username="EarlyLeaver", ws=ws)

        async def run_test():
            await room.add_player(p1)
            round_obj = room.round
            round_obj.language = "english"
            round_obj.seed_words = ["planet", "stream"]
            round_obj.pool = sorted(list("planetstream"))

            # Player scores
            await round_obj.submit_word(p1, "plate")
            score_earned = p1.score
            self.assertGreater(score_earned, 0)

            # Player leaves mid-round
            await room.remove_player("p1")
            self.assertEqual(len(room.players), 0)
            self.assertIn("p1", room.scored_history)

            # Finish round
            await round_obj.finish()
            # In-memory persistence contains the early leaver's score
            from phase7.game.persistence import persistence
            saved_round = persistence.in_memory_rounds[-1]
            leaver_results = [r for r in saved_round["players"] if r["user_id"] == "p1"]
            self.assertEqual(len(leaver_results), 1)
            self.assertEqual(leaver_results[0]["score"], score_earned)

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
