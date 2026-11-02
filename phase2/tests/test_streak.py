from datetime import datetime, timedelta, timezone
from uuid import uuid4
try:
    import pytest
except ImportError:
    pytest = None
from phase2.app.services.streak import is_streak_activity


def simulate_streak(history_days: list[int]) -> tuple[int, int]:
    """Simulates calendar day activity according to Postgres update_streak() rules."""
    current_streak = 0
    longest_streak = 0
    last_date = None

    base_time = datetime(2025, 1, 1, 10, 0, tzinfo=timezone.utc)

    for day in history_days:
        activity_date = (base_time + timedelta(days=day)).date()
        if last_date is None or activity_date < last_date:
            current_streak = 1
        elif (activity_date - last_date).days > 1:
            current_streak = 1
        elif (activity_date - last_date).days == 1:
            current_streak += 1
        # same day: unchanged

        longest_streak = max(longest_streak, current_streak)
        last_date = activity_date

    return current_streak, longest_streak


def test_streak_activity_filter():
    assert is_streak_activity(True) is True
    assert is_streak_activity(False) is False


def test_streak_progression_and_gap_reset():
    # Day 1: first solve
    c, l = simulate_streak([1])
    assert c == 1 and l == 1

    # Day 2: consecutive solve
    c, l = simulate_streak([1, 2])
    assert c == 2 and l == 2

    # Day 2 again: same day solve -> streak unchanged
    c, l = simulate_streak([1, 2, 2])
    assert c == 2 and l == 2

    # Skip Day 3, solve Day 4 -> gap >= 2 days resets streak to 1, longest stays 2
    c, l = simulate_streak([1, 2, 2, 4])
    assert c == 1 and l == 2

    # Day 5, Day 6, Day 7: consecutive streak climbs to 4, surpassing prior longest
    c, l = simulate_streak([1, 2, 2, 4, 5, 6, 7])
    assert c == 4 and l == 4
