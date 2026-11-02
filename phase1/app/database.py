import json
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone

# Hand-authored seed data store (fallback and in-memory cache)
SEEDED_CHALLENGES: List[Dict[str, Any]] = [
    {
        "id": UUID("11111111-1111-1111-1111-000000000001"),
        "slug": "sum_two",
        "title": "Sum of two numbers",
        "description": "Write a function that accepts two integers `a` and `b` and returns their sum.",
        "tier": 1,
        "topic": "Arithmetic",
        "starter_code": "def solve(a: int, b: int) -> int:\n    # Return the sum of a and b\n    pass\n",
        "test_spec": [
            {"input": {"a": 3, "b": 4}, "expected": 7, "weight": 1},
            {"input": {"a": 0, "b": 0}, "expected": 0, "weight": 1},
            {"input": {"a": -5, "b": 12}, "expected": 7, "weight": 1},
            {"input": {"a": 100, "b": 250}, "expected": 350, "weight": 1},
            {"input": {"a": -20, "b": -30}, "expected": -50, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000002"),
        "slug": "subtract",
        "title": "Subtract numbers",
        "description": "Write a function that accepts two numbers `a` and `b` and returns the result of `a - b`.",
        "tier": 1,
        "topic": "Arithmetic",
        "starter_code": "def solve(a: int, b: int) -> int:\n    # Return a minus b\n    pass\n",
        "test_spec": [
            {"input": {"a": 10, "b": 4}, "expected": 6, "weight": 1},
            {"input": {"a": 5, "b": 15}, "expected": -10, "weight": 1},
            {"input": {"a": 0, "b": 0}, "expected": 0, "weight": 1},
            {"input": {"a": -3, "b": -7}, "expected": 4, "weight": 1},
            {"input": {"a": 100, "b": 55}, "expected": 45, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000003"),
        "slug": "multiply",
        "title": "Multiply two numbers",
        "description": "Write a function that accepts two integers `a` and `b` and returns their product.",
        "tier": 1,
        "topic": "Arithmetic",
        "starter_code": "def solve(a: int, b: int) -> int:\n    # Return the product of a and b\n    pass\n",
        "test_spec": [
            {"input": {"a": 6, "b": 7}, "expected": 42, "weight": 1},
            {"input": {"a": 0, "b": 99}, "expected": 0, "weight": 1},
            {"input": {"a": -4, "b": 5}, "expected": -20, "weight": 1},
            {"input": {"a": -8, "b": -8}, "expected": 64, "weight": 1},
            {"input": {"a": 12, "b": 12}, "expected": 144, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000004"),
        "slug": "area_rectangle",
        "title": "Area of a rectangle",
        "description": "Write a function that computes the area of a rectangle given its `width` and `height`.",
        "tier": 1,
        "topic": "Arithmetic",
        "starter_code": "def solve(width: int, height: int) -> int:\n    # Compute width * height\n    pass\n",
        "test_spec": [
            {"input": {"width": 5, "height": 8}, "expected": 40, "weight": 1},
            {"input": {"width": 10, "height": 10}, "expected": 100, "weight": 1},
            {"input": {"width": 3, "height": 7}, "expected": 21, "weight": 1},
            {"input": {"width": 1, "height": 99}, "expected": 99, "weight": 1},
            {"input": {"width": 12, "height": 6}, "expected": 72, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000005"),
        "slug": "average_two",
        "title": "Average of two numbers",
        "description": "Write a function that calculates the arithmetic mean of two numbers `a` and `b`.",
        "tier": 1,
        "topic": "Arithmetic",
        "starter_code": "def solve(a: float, b: float) -> float:\n    # Compute average\n    pass\n",
        "test_spec": [
            {"input": {"a": 4, "b": 6}, "expected": 5.0, "weight": 1},
            {"input": {"a": 10, "b": 20}, "expected": 15.0, "weight": 1},
            {"input": {"a": 3, "b": 4}, "expected": 3.5, "weight": 1},
            {"input": {"a": 0, "b": 0}, "expected": 0.0, "weight": 1},
            {"input": {"a": -10, "b": 10}, "expected": 0.0, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    # TIER 2
    {
        "id": UUID("11111111-1111-1111-1111-000000000006"),
        "slug": "max_of_two",
        "title": "Maximum of two numbers",
        "description": "Write a function that accepts two numbers `a` and `b` and returns the greater number.",
        "tier": 2,
        "topic": "Conditionals",
        "starter_code": "def solve(a: int, b: int) -> int:\n    # Return whichever is larger\n    pass\n",
        "test_spec": [
            {"input": {"a": 10, "b": 5}, "expected": 10, "weight": 1},
            {"input": {"a": 3, "b": 8}, "expected": 8, "weight": 1},
            {"input": {"a": 7, "b": 7}, "expected": 7, "weight": 1},
            {"input": {"a": -5, "b": -2}, "expected": -2, "weight": 1},
            {"input": {"a": 0, "b": -10}, "expected": 0, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000007"),
        "slug": "is_even",
        "title": "Check if number is even",
        "description": "Write a function that returns True if integer `n` is even, and False if odd.",
        "tier": 2,
        "topic": "Conditionals",
        "starter_code": "def solve(n: int) -> bool:\n    # Return True if even, else False\n    pass\n",
        "test_spec": [
            {"input": {"n": 4}, "expected": True, "weight": 1},
            {"input": {"n": 7}, "expected": False, "weight": 1},
            {"input": {"n": 0}, "expected": True, "weight": 1},
            {"input": {"n": -2}, "expected": True, "weight": 1},
            {"input": {"n": 101}, "expected": False, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000008"),
        "slug": "grade_letter",
        "title": "Letter grade from score",
        "description": "Return 'A' for >=90, 'B' for >=80, 'C' for >=70, 'D' for >=60, otherwise 'F'.",
        "tier": 2,
        "topic": "Conditionals",
        "starter_code": "def solve(score: int) -> str:\n    # Return grade letter\n    pass\n",
        "test_spec": [
            {"input": {"score": 95}, "expected": "A", "weight": 1},
            {"input": {"score": 82}, "expected": "B", "weight": 1},
            {"input": {"score": 75}, "expected": "C", "weight": 1},
            {"input": {"score": 61}, "expected": "D", "weight": 1},
            {"input": {"score": 45}, "expected": "F", "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000009"),
        "slug": "absolute_value",
        "title": "Absolute value",
        "description": "Write a function that returns the non-negative magnitude of integer `n`.",
        "tier": 2,
        "topic": "Conditionals",
        "starter_code": "def solve(n: int) -> int:\n    # Return absolute value\n    pass\n",
        "test_spec": [
            {"input": {"n": -15}, "expected": 15, "weight": 1},
            {"input": {"n": 20}, "expected": 20, "weight": 1},
            {"input": {"n": 0}, "expected": 0, "weight": 1},
            {"input": {"n": -1}, "expected": 1, "weight": 1},
            {"input": {"n": 999}, "expected": 999, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000010"),
        "slug": "sign_of_number",
        "title": "Sign of a number",
        "description": "Return 'positive' if n > 0, 'negative' if n < 0, or 'zero' if n == 0.",
        "tier": 2,
        "topic": "Conditionals",
        "starter_code": "def solve(n: int) -> str:\n    # Return positive, negative, or zero\n    pass\n",
        "test_spec": [
            {"input": {"n": 42}, "expected": "positive", "weight": 1},
            {"input": {"n": -7}, "expected": "negative", "weight": 1},
            {"input": {"n": 0}, "expected": "zero", "weight": 1},
            {"input": {"n": 1}, "expected": "positive", "weight": 1},
            {"input": {"n": -99}, "expected": "negative", "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    # TIER 3
    {
        "id": UUID("11111111-1111-1111-1111-000000000011"),
        "slug": "sum_to_n",
        "title": "Sum numbers up to n",
        "description": "Calculate the sum of all positive integers from 1 up to and including `n`.",
        "tier": 3,
        "topic": "Loops",
        "starter_code": "def solve(n: int) -> int:\n    # Sum from 1 to n\n    pass\n",
        "test_spec": [
            {"input": {"n": 5}, "expected": 15, "weight": 1},
            {"input": {"n": 1}, "expected": 1, "weight": 1},
            {"input": {"n": 10}, "expected": 55, "weight": 1},
            {"input": {"n": 3}, "expected": 6, "weight": 1},
            {"input": {"n": 100}, "expected": 5050, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000012"),
        "slug": "count_evens",
        "title": "Count even numbers up to n",
        "description": "Count how many even integers exist between 1 and `n` (inclusive).",
        "tier": 3,
        "topic": "Loops",
        "starter_code": "def solve(n: int) -> int:\n    # Count evens from 1 to n\n    pass\n",
        "test_spec": [
            {"input": {"n": 6}, "expected": 3, "weight": 1},
            {"input": {"n": 10}, "expected": 5, "weight": 1},
            {"input": {"n": 1}, "expected": 0, "weight": 1},
            {"input": {"n": 5}, "expected": 2, "weight": 1},
            {"input": {"n": 20}, "expected": 10, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000013"),
        "slug": "factorial",
        "title": "Calculate factorial",
        "description": "Return `n!` (product of integers from 1 to n). Note that 0! equals 1.",
        "tier": 3,
        "topic": "Loops",
        "starter_code": "def solve(n: int) -> int:\n    # Return factorial of n\n    pass\n",
        "test_spec": [
            {"input": {"n": 5}, "expected": 120, "weight": 1},
            {"input": {"n": 0}, "expected": 1, "weight": 1},
            {"input": {"n": 1}, "expected": 1, "weight": 1},
            {"input": {"n": 4}, "expected": 24, "weight": 1},
            {"input": {"n": 6}, "expected": 720, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000014"),
        "slug": "power_loop",
        "title": "Power calculation",
        "description": "Compute `base` raised to the power of `exp` (where exp >= 0).",
        "tier": 3,
        "topic": "Loops",
        "starter_code": "def solve(base: int, exp: int) -> int:\n    # Return base raised to exp\n    pass\n",
        "test_spec": [
            {"input": {"base": 2, "exp": 3}, "expected": 8, "weight": 1},
            {"input": {"base": 5, "exp": 0}, "expected": 1, "weight": 1},
            {"input": {"base": 3, "exp": 4}, "expected": 81, "weight": 1},
            {"input": {"base": 10, "exp": 2}, "expected": 100, "weight": 1},
            {"input": {"base": 4, "exp": 2}, "expected": 16, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000015"),
        "slug": "fizzbuzz_basic",
        "title": "FizzBuzz check",
        "description": "Return 'FizzBuzz' if divisible by 15, 'Fizz' if by 3, 'Buzz' if by 5, else string of n.",
        "tier": 3,
        "topic": "Loops",
        "starter_code": "def solve(n: int) -> str:\n    # Return Fizz, Buzz, FizzBuzz or str(n)\n    pass\n",
        "test_spec": [
            {"input": {"n": 15}, "expected": "FizzBuzz", "weight": 1},
            {"input": {"n": 9}, "expected": "Fizz", "weight": 1},
            {"input": {"n": 10}, "expected": "Buzz", "weight": 1},
            {"input": {"n": 7}, "expected": "7", "weight": 1},
            {"input": {"n": 30}, "expected": "FizzBuzz", "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    # TIER 4
    {
        "id": UUID("11111111-1111-1111-1111-000000000016"),
        "slug": "max_in_list",
        "title": "Find maximum in a list",
        "description": "Write a function that finds and returns the largest number in a list of numbers.",
        "tier": 4,
        "topic": "Lists",
        "starter_code": "def solve(numbers: list[int]) -> int:\n    # Return maximum element\n    pass\n",
        "test_spec": [
            {"input": {"numbers": [1, 5, 3, 9, 2]}, "expected": 9, "weight": 1},
            {"input": {"numbers": [-10, -5, -20]}, "expected": -5, "weight": 1},
            {"input": {"numbers": [42]}, "expected": 42, "weight": 1},
            {"input": {"numbers": [0, 0, 0]}, "expected": 0, "weight": 1},
            {"input": {"numbers": [100, 200, 50]}, "expected": 200, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000017"),
        "slug": "sum_list",
        "title": "Sum all list elements",
        "description": "Write a function that calculates and returns the sum of all numbers in a list.",
        "tier": 4,
        "topic": "Lists",
        "starter_code": "def solve(numbers: list[int]) -> int:\n    # Return sum of numbers\n    pass\n",
        "test_spec": [
            {"input": {"numbers": [1, 2, 3, 4, 5]}, "expected": 15, "weight": 1},
            {"input": {"numbers": []}, "expected": 0, "weight": 1},
            {"input": {"numbers": [-5, 5, -10, 10]}, "expected": 0, "weight": 1},
            {"input": {"numbers": [100, 250]}, "expected": 350, "weight": 1},
            {"input": {"numbers": [7]}, "expected": 7, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000018"),
        "slug": "reverse_list",
        "title": "Reverse a list",
        "description": "Write a function that returns a new list containing elements in reverse order.",
        "tier": 4,
        "topic": "Lists",
        "starter_code": "def solve(items: list) -> list:\n    # Return reversed items\n    pass\n",
        "test_spec": [
            {"input": {"items": [1, 2, 3]}, "expected": [3, 2, 1], "weight": 1},
            {"input": {"items": ["a", "b", "c"]}, "expected": ["c", "b", "a"], "weight": 1},
            {"input": {"items": []}, "expected": [], "weight": 1},
            {"input": {"items": [42]}, "expected": [42], "weight": 1},
            {"input": {"items": [10, 20, 30, 40]}, "expected": [40, 30, 20, 10], "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000019"),
        "slug": "count_item",
        "title": "Count occurrences in list",
        "description": "Write a function that counts how many times `target` appears in list `items`.",
        "tier": 4,
        "topic": "Lists",
        "starter_code": "def solve(items: list, target) -> int:\n    # Return count of target in items\n    pass\n",
        "test_spec": [
            {"input": {"items": [1, 2, 2, 3, 2], "target": 2}, "expected": 3, "weight": 1},
            {"input": {"items": ["a", "b", "c"], "target": "z"}, "expected": 0, "weight": 1},
            {"input": {"items": [5, 5, 5, 5], "target": 5}, "expected": 4, "weight": 1},
            {"input": {"items": [], "target": 1}, "expected": 0, "weight": 1},
            {"input": {"items": [True, False, True], "target": True}, "expected": 2, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
    {
        "id": UUID("11111111-1111-1111-1111-000000000020"),
        "slug": "find_index",
        "title": "Find element index in list",
        "description": "Return the zero-based index of the first occurrence of `target` in `items`, or -1 if not found.",
        "tier": 4,
        "topic": "Lists",
        "starter_code": "def solve(items: list, target) -> int:\n    # Return index or -1\n    pass\n",
        "test_spec": [
            {"input": {"items": [10, 20, 30, 40], "target": 30}, "expected": 2, "weight": 1},
            {"input": {"items": ["cat", "dog", "bird"], "target": "cat"}, "expected": 0, "weight": 1},
            {"input": {"items": [1, 2, 3], "target": 99}, "expected": -1, "weight": 1},
            {"input": {"items": [], "target": 5}, "expected": -1, "weight": 1},
            {"input": {"items": [7, 8, 9, 10], "target": 10}, "expected": 3, "weight": 1},
        ],
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
        "created_at": datetime.now(timezone.utc),
    },
]

# In-memory storage table for submissions
_SUBMISSIONS_STORE: Dict[str, Dict[str, Any]] = {}
_PROFILES_STORE: Dict[UUID, Dict[str, Any]] = {
    UUID("00000000-0000-0000-0000-000000000001"): {
        "id": UUID("00000000-0000-0000-0000-000000000001"),
        "username": "student_demo",
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc),
    }
}


async def get_all_challenges() -> List[Dict[str, Any]]:
    return SEEDED_CHALLENGES


async def get_challenge_by_id(challenge_id: UUID) -> Optional[Dict[str, Any]]:
    for c in SEEDED_CHALLENGES:
        if c["id"] == challenge_id:
            return c
    return None


async def get_challenge_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    for c in SEEDED_CHALLENGES:
        if c["slug"] == slug:
            return c
    return None


async def get_profile(user_id: UUID) -> Optional[Dict[str, Any]]:
    if user_id in _PROFILES_STORE:
        return _PROFILES_STORE[user_id]
    profile = {
        "id": user_id,
        "username": f"user_{str(user_id)[:8]}",
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc),
    }
    _PROFILES_STORE[user_id] = profile
    return profile


async def record_submission(
    user_id: UUID,
    challenge_id: UUID,
    code: str,
    passed: bool,
    execution_ms: int,
    stdout: str,
    stderr: str,
    results: List[Dict[str, Any]],
) -> UUID:
    """Records submission with ON CONFLICT DO NOTHING semantics (idempotency guard)."""
    key = f"{user_id}_{challenge_id}"
    submission_id = uuid4()

    record = {
        "id": submission_id,
        "user_id": user_id,
        "challenge_id": challenge_id,
        "code": code,
        "passed": passed,
        "execution_ms": execution_ms,
        "stdout": stdout,
        "stderr": stderr,
        "results": results,
        "created_at": datetime.now(timezone.utc),
    }

    # Only insert if never submitted, or update if prior attempt failed
    existing = _SUBMISSIONS_STORE.get(key)
    if existing is None:
        _SUBMISSIONS_STORE[key] = record
        return submission_id
    elif not existing.get("passed", False):
        _SUBMISSIONS_STORE[key] = record
        return submission_id

    # If already passed, retain existing first pass ID
    return existing["id"]
