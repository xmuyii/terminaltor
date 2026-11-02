import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

DEMO_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6InN0dWRlbnRAc292ZXJlaWduLmFjYWRlbXkiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.simulated_signature"


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_challenges():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/challenges")
        assert res.status_code == 200
        challenges = res.json()
        assert len(challenges) == 20
        # Check tier coverage
        tiers = {c["tier"] for c in challenges}
        assert tiers == {1, 2, 3, 4}


@pytest.mark.asyncio
async def test_execute_unauthorized_without_jwt():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/execute",
            json={
                "challenge_id": "11111111-1111-1111-1111-000000000001",
                "code": "def solve(a, b): return a + b",
            },
        )
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_execute_valid_sum_two_passes_5_out_of_5():
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_JWT}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/execute",
            headers=headers,
            json={
                "challenge_id": "11111111-1111-1111-1111-000000000001",
                "code": "def solve(a: int, b: int) -> int:\n    return a + b\n",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["passed"] is True
        result = data["result"]
        assert result["total_tests"] == 5
        assert result["passed_tests"] == 5
        assert result["execution_ms"] < 1500
        assert all(t["passed"] is True for t in result["results"])
