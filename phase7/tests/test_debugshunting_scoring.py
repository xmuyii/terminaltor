import unittest

from phase7.game.debugshunting.scoring import calculate_question_score, score_answers


class TestDebugsHuntingScoring(unittest.TestCase):
    def test_individual_score_tiers(self):
        # Fastest correct -> 100
        self.assertEqual(calculate_question_score(True, 1), 100)
        # 2nd correct -> 60
        self.assertEqual(calculate_question_score(True, 2), 60)
        # 3rd correct -> 60
        self.assertEqual(calculate_question_score(True, 3), 60)
        # 4th and later correct -> 30
        self.assertEqual(calculate_question_score(True, 4), 30)
        self.assertEqual(calculate_question_score(True, 5), 30)
        # Wrong answer -> 0
        self.assertEqual(calculate_question_score(False, 1), 0)
        self.assertEqual(calculate_question_score(False, 2), 0)

    def test_multi_player_answer_evaluation(self):
        correct_index = 2
        # Player answers: player_id -> (chosen_index, elapsed_seconds)
        answers = {
            "p1": (2, 1.2),   # Correct, 1st (fastest)
            "p2": (2, 2.4),   # Correct, 2nd
            "p3": (0, 0.8),   # Wrong, answered fast
            "p4": (2, 3.1),   # Correct, 3rd
            "p5": (2, 4.5),   # Correct, 4th
        }

        results = score_answers(answers, correct_index)

        self.assertEqual(results["p1"]["points"], 100)
        self.assertEqual(results["p1"]["rank"], 1)
        self.assertTrue(results["p1"]["is_correct"])

        self.assertEqual(results["p2"]["points"], 60)
        self.assertEqual(results["p2"]["rank"], 2)

        self.assertEqual(results["p4"]["points"], 60)
        self.assertEqual(results["p4"]["rank"], 3)

        self.assertEqual(results["p5"]["points"], 30)
        self.assertEqual(results["p5"]["rank"], 4)

        self.assertEqual(results["p3"]["points"], 0)
        self.assertFalse(results["p3"]["is_correct"])


if __name__ == "__main__":
    unittest.main()
