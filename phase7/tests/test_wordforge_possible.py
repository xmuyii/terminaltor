from collections import Counter
import unittest

from phase7.game.wordforge.possible import compute_possible_count


class TestWordForgePossible(unittest.TestCase):
    def setUp(self):
        self.sample_words = [
            "cat",      # len < 4, should be ignored
            "planet",   # seed word
            "stream",   # seed word
            "plate",    # formable
            "plant",    # formable
            "metal",    # formable
            "master",   # formable
            "wizard",   # not formable
            "castle",   # not formable
        ]
        self.seed_words = ["planet", "stream"]
        self.initial_pool = sorted(list("planetstream"))

    def test_empty_pool_returns_zero(self):
        self.assertEqual(compute_possible_count(self.sample_words, [], self.seed_words), 0)

    def test_possible_count_at_t0_matches_brute_force(self):
        count = compute_possible_count(
            words=self.sample_words,
            pool=self.initial_pool,
            seed_words=self.seed_words,
            found_words=set(),
        )

        # Brute force manual verification
        pool_counter = Counter(self.initial_pool)
        manual_count = 0
        for w in self.sample_words:
            if len(w) >= 4 and w not in self.seed_words and Counter(w) <= pool_counter:
                manual_count += 1

        self.assertEqual(count, manual_count)
        self.assertGreater(count, 0)

    def test_possible_count_at_t90_subtracts_found_words(self):
        # Add 2 letters to pool ('o', 'd')
        new_pool = sorted(self.initial_pool + ["o", "d"])
        found_words = {"plate", "plant"}

        count = compute_possible_count(
            words=self.sample_words,
            pool=new_pool,
            seed_words=self.seed_words,
            found_words=found_words,
        )

        pool_counter = Counter(new_pool)
        manual_count = 0
        for w in self.sample_words:
            if len(w) >= 4 and w not in self.seed_words and w not in found_words and Counter(w) <= pool_counter:
                manual_count += 1

        self.assertEqual(count, manual_count)


if __name__ == "__main__":
    unittest.main()
