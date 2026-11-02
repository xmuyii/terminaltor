import time
import unittest
from types import SimpleNamespace

from phase7.game.wordforge.validation import classify


class TestWordForgeValidation(unittest.TestCase):
    def setUp(self):
        # Room with pool = "planetstream" (planet + stream), language="english", seed_words=["planet", "stream"]
        self.room = SimpleNamespace(
            found_words=set(),
            round=SimpleNamespace(
                language="english",
                seed_words=["planet", "stream"],
                pool=list("planetstream"),
            ),
        )
        self.player1 = SimpleNamespace(
            id="p1",
            username="Alice",
            submitted_words=set(),
            last_submit_ts=0.0,
        )
        self.player2 = SimpleNamespace(
            id="p2",
            username="Bob",
            submitted_words=set(),
            last_submit_ts=0.0,
        )

    def test_word_too_short_is_silent(self):
        self.assertEqual(classify("cat", self.room, self.player1), "silent")
        self.assertEqual(classify("a", self.room, self.player1), "silent")

    def test_seed_word_is_silent(self):
        self.assertEqual(classify("planet", self.room, self.player1), "silent")
        self.assertEqual(classify("stream", self.room, self.player1), "silent")

    def test_word_not_formable_from_pool_is_silent(self):
        # 'quartz' contains q, u, z which are not in 'planetstream'
        self.assertEqual(classify("quartz", self.room, self.player1), "silent")

    def test_word_not_in_dictionary_is_silent(self):
        # 'asdf' is not in English dictionary
        self.assertEqual(classify("asdf", self.room, self.player1), "silent")

    def test_valid_word_is_accepted(self):
        # 'plate' is in English and formable from 'planetstream'
        verdict = classify("plate", self.room, self.player1)
        self.assertEqual(verdict, "accept")

    def test_word_already_submitted_by_self_is_already_guessed(self):
        self.player1.submitted_words.add("plate")
        self.assertEqual(classify("plate", self.room, self.player1), "already_guessed")

    def test_word_already_found_by_another_player_is_already_guessed(self):
        self.room.found_words.add("plate")
        self.assertEqual(classify("plate", self.room, self.player2), "already_guessed")

    def test_rate_limit_violation_is_silent(self):
        # First submission sets timestamp
        v1 = classify("plate", self.room, self.player1)
        self.assertEqual(v1, "accept")
        
        # Second submission within 100ms (< 400ms)
        v2 = classify("steam", self.room, self.player1)
        self.assertEqual(v2, "silent")


if __name__ == "__main__":
    unittest.main()
