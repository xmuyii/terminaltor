try:
    import pytest
except ImportError:
    pytest = None
from phase2.app.services.xp import compute_xp


def test_xp_full_pass():
    assert compute_xp(20, 5, 5) == 20


def test_xp_zero_pass():
    assert compute_xp(20, 5, 0) == 0


def test_xp_empty_tests():
    assert compute_xp(20, 0, 0) == 0


def test_xp_partial_credit_math():
    # 2/4 -> ratio=0.5 -> multiplier = 0.30 + 0.70 * 0.5 = 0.65 -> 20 * 0.65 = 13
    assert compute_xp(20, 4, 2) == 13
