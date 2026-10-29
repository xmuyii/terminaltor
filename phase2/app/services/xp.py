def compute_xp(
    challenge_xp_reward: int,
    total_tests: int,
    passed_tests: int
) -> int:
    """Base reward scaled by pass ratio, floored at 30% of base.

    - All tests pass  → 100% of base
    - Half tests pass → 65% of base
    - Zero tests pass → 0 XP (no partial credit for zero)
    """
    if total_tests == 0 or passed_tests == 0:
        return 0
    ratio = passed_tests / total_tests
    multiplier = 0.30 + 0.70 * ratio
    return max(1, int(round(challenge_xp_reward * multiplier)))
