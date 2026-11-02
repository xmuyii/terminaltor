import asyncio
from uuid import UUID

from phase4.app.api.v1.leaderboard import (
    HTTPException,
    get_default_leaderboard,
    get_my_timeframe_rank,
    get_timeframe_leaderboard,
)

try:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from phase4.app.api.v1.leaderboard import router as leaderboard_router
    app = FastAPI()
    app.include_router(leaderboard_router, prefix="/api/v1")
    client = TestClient(app)
    HAS_FASTAPI = True
except ImportError:
    client = None
    HAS_FASTAPI = False


def test_api_four_timeframe_endpoints_success():
    """Verifies that all 4 timeframes return valid responses with required schema fields."""
    for tf in ["daily", "weekly", "monthly", "all_time"]:
        if HAS_FASTAPI and client:
            res = client.get(f"/api/v1/leaderboard/{tf}?page=1&page_size=10")
            assert res.status_code == 200, f"Failed for timeframe {tf}: {res.text}"
            data = res.json()
            assert data["timeframe"] == tf
            assert data["page"] == 1
            assert data["page_size"] == 10
            assert "total" in data
            assert "total_pages" in data
            assert "cached" in data
            assert isinstance(data["entries"], list)
        else:
            resp = asyncio.run(get_timeframe_leaderboard(timeframe=tf, page=1, page_size=10))
            assert resp.timeframe == tf
            assert resp.page == 1
            assert resp.page_size == 10
            assert hasattr(resp, "total")
            assert hasattr(resp, "total_pages")
            assert hasattr(resp, "cached")
            assert isinstance(resp.entries, list)


def test_api_default_route_returns_all_time():
    """Verifies that GET /api/v1/leaderboard defaults to all_time board."""
    if HAS_FASTAPI and client:
        res = client.get("/api/v1/leaderboard?page=1&page_size=5")
        assert res.status_code == 200
        data = res.json()
        assert data["timeframe"] == "all_time"
    else:
        resp = asyncio.run(get_default_leaderboard(page=1, page_size=5))
        assert resp.timeframe == "all_time"


def test_api_invalid_timeframe_returns_400():
    """Verifies that an unsupported timeframe returns HTTP 400 Bad Request."""
    if HAS_FASTAPI and client:
        res = client.get("/api/v1/leaderboard/century")
        assert res.status_code == 400
        assert "Invalid timeframe" in res.json()["detail"]
    else:
        try:
            asyncio.run(get_timeframe_leaderboard(timeframe="century", page=1, page_size=10))
            assert False, "Should have raised HTTPException 400"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Invalid timeframe" in str(e.detail)


def test_api_user_rank_me_endpoint():
    """Verifies GET /api/v1/leaderboard/{timeframe}/me returns the student's metrics."""
    test_user = UUID("11111111-0000-0000-0000-000000000001")
    if HAS_FASTAPI and client:
        res = client.get(f"/api/v1/leaderboard/daily/me?user_id={test_user}")
        assert res.status_code == 200
        data = res.json()
        assert data["timeframe"] == "daily"
        assert data["user_id"] == str(test_user)
        assert "rank" in data
        assert "points" in data
        assert "challenges_solved" in data
    else:
        resp = asyncio.run(get_my_timeframe_rank(timeframe="daily", user_id_override=test_user))
        assert resp.timeframe == "daily"
        assert resp.user_id == test_user
        assert hasattr(resp, "rank")
        assert hasattr(resp, "points")
        assert hasattr(resp, "challenges_solved")
