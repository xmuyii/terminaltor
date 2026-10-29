from uuid import uuid4
try:
    import pytest
except ImportError:
    class MockPytestMark:
        @staticmethod
        def asyncio(f): return f
    class MockPytest:
        mark = MockPytestMark
    pytest = MockPytest()
from phase2.app.services.badges import evaluate_badges, get_user_badges_list


@pytest.mark.asyncio
async def test_badges_zero_xp_no_badges():
    uid = uuid4()
    newly = await evaluate_badges(user_id=uid, total_xp=0, current_streak=0, solves_count=0)
    assert len(newly) == 0
    assert len(get_user_badges_list(uid)) == 0


@pytest.mark.asyncio
async def test_badges_first_steps_unlocked():
    uid = uuid4()
    newly = await evaluate_badges(user_id=uid, total_xp=10, current_streak=1, solves_count=1)
    assert "first_steps" in newly
    assert len(get_user_badges_list(uid)) == 1


@pytest.mark.asyncio
async def test_badges_century_unlocked():
    uid = uuid4()
    # Cross 100 XP
    newly = await evaluate_badges(user_id=uid, total_xp=110, current_streak=1, solves_count=1)
    assert "first_steps" in newly
    assert "century" in newly


@pytest.mark.asyncio
async def test_badges_idempotency():
    uid = uuid4()
    # First invocation awards first_steps
    res1 = await evaluate_badges(user_id=uid, total_xp=10, current_streak=1, solves_count=1)
    assert "first_steps" in res1

    # Second invocation with same metrics awards nothing new
    res2 = await evaluate_badges(user_id=uid, total_xp=10, current_streak=1, solves_count=1)
    assert len(res2) == 0
