import unittest
from types import SimpleNamespace

from phase7.game.wordforge.language_rotation import LANGUAGES, NON_ENGLISH, pick_next_language


class TestWordForgeLanguageRotation(unittest.TestCase):
    def test_never_four_english_in_a_row_and_no_non_english_repeat(self):
        room = SimpleNamespace(recent_languages=[])
        history = []

        for _ in range(100):
            lang = pick_next_language(room)
            history.append(lang)

        # Assert: never 4 English in a row
        for i in range(len(history) - 3):
            window = history[i:i + 4]
            self.assertFalse(all(l == "english" for l in window), f"Found 4 consecutive english at index {i}")

        # Assert: no non-english repeats consecutively
        for i in range(len(history) - 1):
            if history[i] != "english":
                self.assertNotEqual(
                    history[i],
                    history[i + 1],
                    f"Non-english '{history[i]}' repeated consecutively at index {i}",
                )

    def test_force_three_english_forces_non_english(self):
        room = SimpleNamespace(recent_languages=["english", "english", "english"])
        lang = pick_next_language(room)
        self.assertIn(lang, NON_ENGLISH)
        self.assertNotEqual(lang, "english")

    def test_force_python_cannot_be_python(self):
        room = SimpleNamespace(recent_languages=["python"])
        lang = pick_next_language(room)
        self.assertNotEqual(lang, "python")
        self.assertIn(lang, LANGUAGES)


if __name__ == "__main__":
    unittest.main()
