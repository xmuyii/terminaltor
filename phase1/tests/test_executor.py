import asyncio
import pytest
from app.services.executor import run_python

# Sample test spec with 5 cases
SAMPLE_SPEC = [
    {"input": {"a": 3, "b": 4}, "expected": 7, "weight": 1},
    {"input": {"a": 0, "b": 0}, "expected": 0, "weight": 1},
    {"input": {"a": -5, "b": 12}, "expected": 7, "weight": 1},
    {"input": {"a": 100, "b": 250}, "expected": 350, "weight": 1},
    {"input": {"a": -20, "b": -30}, "expected": -50, "weight": 1},
]


@pytest.mark.asyncio
async def test_executor_passes_simple_solve():
    code = "def solve(a, b):\n    return a + b\n"
    res = await run_python(code, SAMPLE_SPEC, timeout_seconds=5)

    assert res["fatal"] is None
    assert len(res["results"]) == 5
    assert all(r["passed"] is True for r in res["results"])
    assert res["execution_ms"] < 2000


@pytest.mark.asyncio
async def test_executor_timeout_infinite_loop():
    code = "def solve(a, b):\n    while True:\n        pass\n"
    res = await run_python(code, SAMPLE_SPEC, timeout_seconds=2)

    assert res["fatal"] is not None
    assert "Timeout after" in res["fatal"]
    assert len(res["results"]) == 0


@pytest.mark.asyncio
async def test_executor_blocked_import():
    code = "def solve(a, b):\n    import os\n    return a + b\n"
    res = await run_python(code, SAMPLE_SPEC, timeout_seconds=5)

    assert res["fatal"] is None
    assert len(res["results"]) == 5
    # The case should fail with ImportError
    assert any("ImportError" in str(r.get("error")) for r in res["results"])


@pytest.mark.asyncio
async def test_executor_missing_solve():
    code = "def other_function(a, b):\n    return a + b\n"
    res = await run_python(code, SAMPLE_SPEC, timeout_seconds=5)

    assert res["fatal"] is not None
    assert "Missing required function 'solve'" in res["fatal"]


@pytest.mark.asyncio
async def test_executor_oversized_code():
    huge_code = "# filler\n" * 10000
    res = await run_python(huge_code, SAMPLE_SPEC, max_code_size_bytes=500)

    assert res["fatal"] is not None
    assert "exceeds limit" in res["fatal"]
