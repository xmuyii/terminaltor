from datetime import datetime, timezone
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
from phase2.app.database import _PROFILES, get_leaderboard_all_time


@pytest.mark.asyncio
async def test_leaderboard_ranking_and_pagination():
    _PROFILES.clear()

    # Empty DB
    total, entries = await get_leaderboard_all_time(page=1, page_size=25)
    assert total == 0
    assert len(entries) == 0

    # Insert test profiles: user_zero (0 XP), u1 (10 XP), u2 (50 XP), u3 (30 XP)
    u_zero = uuid4()
    u1 = uuid4()
    u2 = uuid4()
    u3 = uuid4()

    _PROFILES[u_zero] = {"id": u_zero, "username": "zero", "total_xp": 0, "last_active_at": None}
    _PROFILES[u1] = {"id": u1, "username": "u1", "total_xp": 10, "last_active_at": datetime.now(timezone.utc)}
    _PROFILES[u2] = {"id": u2, "username": "u2", "total_xp": 50, "last_active_at": datetime.now(timezone.utc)}
    _PROFILES[u3] = {"id": u3, "username": "u3", "total_xp": 30, "last_active_at": datetime.now(timezone.utc)}

    # Total should exclude 0-XP user -> 3 total
    total, all_entries = await get_leaderboard_all_time(page=1, page_size=10)
    assert total == 3
    assert [e["points"] for e in all_entries] == [50, 30, 10]
    assert [e["rank"] for e in all_entries] == [1, 2, 3]

    # Test Pagination: page_size=2 -> Page 1 has ranks 1 & 2
    total_p1, p1_entries = await get_leaderboard_all_time(page=1, page_size=2)
    assert len(p1_entries) == 2
    assert p1_entries[0]["rank"] == 1 and p1_entries[0]["points"] == 50
    assert p1_entries[1]["rank"] == 2 and p1_entries[1]["points"] == 30

    # Page 2 has rank 3
    total_p2, p2_entries = await get_leaderboard_all_time(page=2, page_size=2)
    assert len(p2_entries) == 1
    assert p2_entries[0]["rank"] == 3 and p2_entries[0]["points"] == 10
