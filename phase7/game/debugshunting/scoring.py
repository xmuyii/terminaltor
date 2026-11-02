"""Debugs Hunting scoring calculator (100 / 60 / 30 / 0)."""
from typing import Any, Dict, List, Optional, Tuple


def calculate_question_score(is_correct: bool, rank: int) -> int:
    """
    Scoring:
      correct, fastest (rank 1) : +100
      correct, 2nd-3rd (rank 2, 3) : +60
      correct, others (rank 4+) : +30
      wrong : 0
    """
    if not is_correct:
        return 0
    if rank == 1:
        return 100
    if rank in (2, 3):
        return 60
    return 30


def score_answers(
    answers: Dict[str, Tuple[int, float]],
    correct_index: int,
) -> Dict[str, Dict[str, Any]]:
    """
    Evaluates answers dictionary: player_id -> (chosen_index, elapsed_time)
    Returns: player_id -> {is_correct: bool, points: int, elapsed: float, rank: int}
    """
    correct_players: List[Tuple[str, float]] = []
    results: Dict[str, Dict[str, Any]] = {}

    for pid, (idx, elapsed) in answers.items():
        is_corr = (idx == correct_index)
        if is_corr:
            correct_players.append((pid, elapsed))
        else:
            results[pid] = {
                "is_correct": False,
                "points": 0,
                "elapsed": round(elapsed, 3),
                "rank": 0,
            }

    # Sort correct players by elapsed time ascending
    correct_players.sort(key=lambda x: x[1])

    for rank, (pid, elapsed) in enumerate(correct_players, start=1):
        points = calculate_question_score(is_correct=True, rank=rank)
        results[pid] = {
            "is_correct": True,
            "points": points,
            "elapsed": round(elapsed, 3),
            "rank": rank,
        }

    return results
