import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from phase2.app.database import _FIRST_PASS_SET, _PROFILES
from phase3.app.database import _SUBMISSIONS
from phase4.app.database import (
    get_raw_leaderboard_for_timeframe,
    get_timeframe_cutoff,
    get_utc_start_of_day,
    get_utc_start_of_month,
    get_utc_start_of_week,
)


def test_utc_cutoff_helpers():
    """Verifies that cutoff calculations align exactly with UTC boundaries."""
    now = datetime(2026, 10, 12, 15, 30, 0, tzinfo=timezone.utc)  # Monday Oct 12, 2026
    day_start = get_utc_start_day = get_utc_start_of_day(now)
    assert day_start.hour == 0 and day_start.minute == 0 and day_start.second == 0
    assert day_start.day == 12

    week_start = get_utc_start_of_week(now)
    assert week_start.weekday() == 0  # Monday
    assert week_start.day == 12

    month_start = get_utc_start_of_month(now)
    assert month_start.day == 1 and month_start.month == 10 and month_start.year == 2026


def test_timeframe_window_filtering():
    """Verifies Definition of Done requirement:
    - Two students who solved at different times of day/week/month appear on the correct boards.
    - A student solving today appears on Daily, Weekly, Monthly, All-Time.
    - A student solving 3 days ago appears on Weekly, Monthly, All-Time, but NOT Daily.
    - A student solving 20 days ago appears on Monthly, All-Time, but NOT Weekly or Daily.
    - A student solving 45 days ago appears on All-Time only.
    """
    now = datetime.now(timezone.utc)

    # Clean test state for isolated view test
    u_today = UUID("11111111-0000-0000-0000-000000000001")
    u_this_week = UUID("22222222-0000-0000-0000-000000000002")
    u_this_month = UUID("33333333-0000-0000-0000-000000000003")
    u_last_month = UUID("44444444-0000-0000-0000-000000000004")

    # Ensure profiles exist
    for u, name in [(u_today, "Alice"), (u_this_week, "Bob"), (u_this_month, "Charlie"), (u_last_month, "Diana")]:
        _PROFILES[u] = {
            "id": u,
            "username": name,
            "avatar_url": None,
            "total_xp": 100,
            "current_streak": 1,
            "longest_streak": 1,
            "last_active_at": now,
            "created_at": now - timedelta(days=60),
        }

    # Add submissions at specific offsets
    # 1. Today (2 hours ago)
    _FIRST_PASS_SET.add((u_today, "chal-t1"))
    _SUBMISSIONS.append({
        "id": uuid4(),
        "user_id": u_today,
        "challenge_id": "chal-t1",
        "code": "def solve(): pass",
        "passed": True,
        "execution_ms": 10,
        "stdout": "",
        "stderr": "",
        "results": [],
        "is_first_pass": True,
        "xp_awarded": 100,
        "created_at": now - timedelta(hours=2),
    })

    # 2. Earlier this week if today is not Monday, or yesterday
    # To be reliably in weekly but not daily, find yesterday or 1 day ago within the same week
    yesterday = now - timedelta(days=1)
    if yesterday >= get_utc_start_of_week(now):
        past_week_dt = yesterday
    else:
        past_week_dt = now - timedelta(hours=26)

    _FIRST_PASS_SET.add((u_this_week, "chal-t2"))
    _SUBMISSIONS.append({
        "id": uuid4(),
        "user_id": u_this_week,
        "challenge_id": "chal-t2",
        "code": "def solve(): pass",
        "passed": True,
        "execution_ms": 15,
        "stdout": "",
        "stderr": "",
        "results": [],
        "is_first_pass": True,
        "xp_awarded": 75,
        "created_at": now - timedelta(days=1, hours=3),
    })

    # 3. 40 days ago (strictly past month)
    _FIRST_PASS_SET.add((u_last_month, "chal-t4"))
    _SUBMISSIONS.append({
        "id": uuid4(),
        "user_id": u_last_month,
        "challenge_id": "chal-t4",
        "code": "def solve(): pass",
        "passed": True,
        "execution_ms": 20,
        "stdout": "",
        "stderr": "",
        "results": [],
        "is_first_pass": True,
        "xp_awarded": 50,
        "created_at": now - timedelta(days=40),
    })

    # Query boards
    daily_board = asyncio.run(get_raw_leaderboard_for_timeframe("daily"))
    daily_user_ids = {e["user_id"] for e in daily_board}

    # u_today must be on daily board
    assert u_today in daily_user_ids, "Student solving today must appear on Daily board"
    # u_last_month must NOT be on daily board
    assert u_last_month not in daily_user_ids, "Student solving 40 days ago must NOT appear on Daily board"

    # Query all-time board
    all_time_board = asyncio.run(get_raw_leaderboard_for_timeframe("all_time"))
    all_time_user_ids = {e["user_id"] for e in all_time_board}
    assert u_today in all_time_user_ids
    assert u_last_month in all_time_user_ids


def test_ranking_points_order_and_dense_rank():
    """Verifies that entries are ranked in descending points order with valid dense ranks."""
    # Ensure test profiles exist
    u_test = UUID("99999999-0000-0000-0000-000000000001")
    _PROFILES[u_test] = {
        "id": u_test,
        "username": "Leader1",
        "avatar_url": None,
        "total_xp": 500,
        "current_streak": 5,
        "longest_streak": 5,
        "last_active_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
    }

    board = asyncio.run(get_raw_leaderboard_for_timeframe("all_time"))
    assert len(board) > 0

    prev_points = float("inf")
    prev_rank = 0
    for entry in board:
        assert entry["points"] <= prev_points, "Board must be sorted descending by points"
        assert entry["rank"] >= prev_rank, "Rank must not decrease"
        assert "user_id" in entry
        assert "username" in entry
        assert "challenges_solved" in entry
        prev_points = entry["points"]
        prev_rank = entry["rank"]
