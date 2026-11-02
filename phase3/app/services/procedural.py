import hashlib
import json
import random
from datetime import date
from typing import Any, Dict, List, Tuple


def seed_for_user_and_day(user_id: str, day_str: str) -> int:
    """Generates a stable 32-bit integer seed from (user_id, day_str)."""
    h = hashlib.sha256(f"{user_id}:{day_str}".encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def _gen_template_1(rng: random.Random, seed: int) -> Dict[str, Any]:
    """Template 1: Sliding Window Maximum."""
    slug = f"proc_sliding_window_{seed}"
    title = f"Sliding Window Maximum [Seed {seed % 1000:03d}]"
    description = (
        "Given a list of integers `nums` and a window size `k`, return a list containing "
        "the maximum value in every contiguous sliding window of size `k`. If `nums` is empty "
        "or `k > len(nums)`, return an empty list."
    )

    starter_code = """def solve(nums: list[int], k: int) -> list[int]:
    # Return maximum of each window of size k
    pass
"""

    reference_solution = """def solve(nums: list[int], k: int) -> list[int]:
    if not nums or k <= 0 or k > len(nums):
        return []
    return [max(nums[i : i + k]) for i in range(len(nums) - k + 1)]
"""

    def ref_func(nums: list, k: int) -> list:
        if not nums or k <= 0 or k > len(nums):
            return []
        return [max(nums[i : i + k]) for i in range(len(nums) - k + 1)]

    test_spec = []
    # Fixed test cases + randomized test cases from rng
    samples = [
        ([1, 3, -1, -3, 5, 3, 6, 7], 3),
        ([1], 1),
        ([], 2),
        ([10, 20, 30, 40], 2),
        ([rng.randint(-50, 50) for _ in range(rng.randint(6, 12))], rng.randint(2, 4)),
    ]

    for item_nums, item_k in samples:
        test_spec.append(
            {
                "input": {"nums": item_nums, "k": item_k},
                "expected": ref_func(item_nums, item_k),
                "weight": 1,
            }
        )

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "starter_code": starter_code,
        "reference_solution": reference_solution,
        "test_spec": test_spec,
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 2,
            "max_args": 2,
            "require_nodes": ["Return"],
        },
    }


def _gen_template_2(rng: random.Random, seed: int) -> Dict[str, Any]:
    """Template 2: Run-Length Token Compressor with dynamic delimiter."""
    delimiters = ["-", "_", "#", "~", ":"]
    delim = delimiters[rng.randint(0, len(delimiters) - 1)]

    slug = f"proc_rle_compressor_{seed}"
    title = f"Token Compressor with '{delim}' [Seed {seed % 1000:03d}]"
    description = (
        f"Compress contiguous repeated characters in `text` into `char{delim}count`. "
        f"For example, 'aaabbc' becomes 'a{delim}3b{delim}2c{delim}1'. "
        "If `text` is empty, return an empty string."
    )

    starter_code = f"""def solve(text: str) -> str:
    # Compress consecutive characters using delimiter '{delim}'
    pass
"""

    reference_solution = f"""def solve(text: str) -> str:
    if not text:
        return ""
    res = []
    i = 0
    while i < len(text):
        c = text[i]
        count = 1
        while i + 1 < len(text) and text[i + 1] == c:
            count += 1
            i += 1
        res.append(f"{{c}}{delim}{{count}}")
        i += 1
    return "".join(res)
"""

    def ref_func(text: str) -> str:
        if not text:
            return ""
        res = []
        i = 0
        while i < len(text):
            c = text[i]
            count = 1
            while i + 1 < len(text) and text[i + 1] == c:
                count += 1
                i += 1
            res.append(f"{c}{delim}{count}")
            i += 1
        return "".join(res)

    chars = ["a", "b", "c", "x", "y", "z"]
    random_str = "".join(rng.choice(chars) * rng.randint(1, 4) for _ in range(4))

    samples = [
        "aaabbc",
        "hello",
        "",
        "zzzzz",
        random_str,
    ]

    test_spec = []
    for s in samples:
        test_spec.append(
            {
                "input": {"text": s},
                "expected": ref_func(s),
                "weight": 1,
            }
        )

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "starter_code": starter_code,
        "reference_solution": reference_solution,
        "test_spec": test_spec,
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
    }


def _gen_template_3(rng: random.Random, seed: int) -> Dict[str, Any]:
    """Template 3: Matrix Spiral Traversal."""
    slug = f"proc_spiral_matrix_{seed}"
    title = f"Matrix Spiral Traversal [Seed {seed % 1000:03d}]"
    description = (
        "Given an `m x n` matrix of integers, return all elements of the matrix in spiral order, "
        "starting from the top-left and moving clockwise."
    )

    starter_code = """def solve(matrix: list[list[int]]) -> list[int]:
    # Return matrix elements in clockwise spiral order
    pass
"""

    reference_solution = """def solve(matrix: list[list[int]]) -> list[int]:
    if not matrix or not matrix[0]:
        return []
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            res.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])
            left += 1
    return res
"""

    def ref_func(matrix: list) -> list:
        if not matrix or not matrix[0]:
            return []
        res = []
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for c in range(left, right + 1):
                res.append(matrix[top][c])
            top += 1
            for r in range(top, bottom + 1):
                res.append(matrix[r][right])
            right -= 1
            if top <= bottom:
                for c in range(right, left - 1, -1):
                    res.append(matrix[bottom][c])
                bottom -= 1
            if left <= right:
                for r in range(bottom, top - 1, -1):
                    res.append(matrix[r][left])
                left += 1
        return res

    samples = [
        [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
        [[1, 2], [3, 4]],
        [[5]],
        [],
        [[1, 2, 3, 4], [5, 6, 7, 8]],
    ]

    test_spec = []
    for m in samples:
        test_spec.append(
            {
                "input": {"matrix": m},
                "expected": ref_func(m),
                "weight": 1,
            }
        )

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "starter_code": starter_code,
        "reference_solution": reference_solution,
        "test_spec": test_spec,
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
    }


def _gen_template_4(rng: random.Random, seed: int) -> Dict[str, Any]:
    """Template 4: Interval Schedule Merger."""
    slug = f"proc_interval_merger_{seed}"
    title = f"Interval Schedule Merger [Seed {seed % 1000:03d}]"
    description = (
        "Given a list of intervals `intervals` where `intervals[i] = [start, end]`, "
        "merge all overlapping intervals and return the result sorted by start time."
    )

    starter_code = """def solve(intervals: list[list[int]]) -> list[list[int]]:
    # Merge overlapping intervals
    pass
"""

    reference_solution = """def solve(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    sorted_int = sorted(intervals, key=lambda x: x[0])
    merged = [list(sorted_int[0])]
    for current in sorted_int[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(list(current))
    return merged
"""

    def ref_func(intervals: list) -> list:
        if not intervals:
            return []
        sorted_int = sorted(intervals, key=lambda x: x[0])
        merged = [list(sorted_int[0])]
        for current in sorted_int[1:]:
            prev = merged[-1]
            if current[0] <= prev[1]:
                prev[1] = max(prev[1], current[1])
            else:
                merged.append(list(current))
        return merged

    samples = [
        [[1, 3], [2, 6], [8, 10], [15, 18]],
        [[1, 4], [4, 5]],
        [[1, 5]],
        [],
        [[1, 10], [2, 3], [4, 8]],
    ]

    test_spec = []
    for intervals in samples:
        test_spec.append(
            {
                "input": {"intervals": intervals},
                "expected": ref_func(intervals),
                "weight": 1,
            }
        )

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "starter_code": starter_code,
        "reference_solution": reference_solution,
        "test_spec": test_spec,
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
    }


def _gen_template_5(rng: random.Random, seed: int) -> Dict[str, Any]:
    """Template 5: Network Shortest Route (BFS)."""
    slug = f"proc_graph_route_{seed}"
    title = f"Network Shortest Route [Seed {seed % 1000:03d}]"
    description = (
        "Given an unweighted graph represented as an adjacency dictionary `graph`, find the minimum "
        "number of hops between `start_node` and `end_node`. Return `-1` if unreachable, or `0` if start == end."
    )

    starter_code = """def solve(graph: dict, start_node: str, end_node: str) -> int:
    # Return shortest distance in hops, or -1 if unreachable
    pass
"""

    reference_solution = """def solve(graph: dict, start_node: str, end_node: str) -> int:
    if start_node == end_node:
        return 0
    from collections import deque
    queue = deque([(start_node, 0)])
    visited = {start_node}
    while queue:
        node, dist = queue.popleft()
        for neighbor in graph.get(node, []):
            if neighbor == end_node:
                return dist + 1
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return -1
"""

    def ref_func(graph: dict, start_node: str, end_node: str) -> int:
        if start_node == end_node:
            return 0
        from collections import deque
        queue = deque([(start_node, 0)])
        visited = {start_node}
        while queue:
            node, dist = queue.popleft()
            for neighbor in graph.get(node, []):
                if neighbor == end_node:
                    return dist + 1
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, dist + 1))
        return -1

    g1 = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C"]}
    g2 = {"X": ["Y"], "Y": ["X"], "Z": []}
    samples = [
        (g1, "A", "D"),
        (g1, "A", "A"),
        (g2, "X", "Z"),
        (g1, "B", "C"),
        ({"1": ["2"], "2": ["3"], "3": ["4"], "4": []}, "1", "4"),
    ]

    test_spec = []
    for g, s, e in samples:
        test_spec.append(
            {
                "input": {"graph": g, "start_node": s, "end_node": e},
                "expected": ref_func(g, s, e),
                "weight": 1,
            }
        )

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "starter_code": starter_code,
        "reference_solution": reference_solution,
        "test_spec": test_spec,
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 3,
            "max_args": 3,
            "require_nodes": ["Return"],
        },
    }


def _gen_template_6(rng: random.Random, seed: int) -> Dict[str, Any]:
    """Template 6: Balanced Parentheses Scorer with dynamic multiplier."""
    multipliers = [2, 3, 4]
    base_scores = [1, 2]
    multiplier = multipliers[rng.randint(0, len(multipliers) - 1)]
    base_score = base_scores[rng.randint(0, len(base_scores) - 1)]

    slug = f"proc_bracket_scorer_{seed}"
    title = f"Parentheses Scorer (x{multiplier}) [Seed {seed % 1000:03d}]"
    description = (
        f"Compute the score of a balanced parentheses string `s`. "
        f"Empty string has score 0. '()' has score {base_score}. "
        f"Nested '(A)' has score {multiplier} * score(A). Concatenated 'AB' has score score(A) + score(B)."
    )

    starter_code = f"""def solve(s: str) -> int:
    # Compute nested parentheses score with base={base_score} and multiplier={multiplier}
    pass
"""

    reference_solution = f"""def solve(s: str) -> int:
    stack = [0]
    for char in s:
        if char == "(":
            stack.append(0)
        elif char == ")":
            val = stack.pop()
            score = {base_score} if val == 0 else {multiplier} * val
            stack[-1] += score
    return stack[0]
"""

    def ref_func(s: str) -> int:
        stack = [0]
        for char in s:
            if char == "(":
                stack.append(0)
            elif char == ")":
                val = stack.pop()
                score = base_score if val == 0 else multiplier * val
                stack[-1] += score
        return stack[0]

    samples = [
        "()",
        "(())",
        "()()",
        "((()))",
        "",
    ]

    test_spec = []
    for s in samples:
        test_spec.append(
            {
                "input": {"s": s},
                "expected": ref_func(s),
                "weight": 1,
            }
        )

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "starter_code": starter_code,
        "reference_solution": reference_solution,
        "test_spec": test_spec,
        "evaluation_spec": {
            "required_function": "solve",
            "min_args": 1,
            "max_args": 1,
            "require_nodes": ["Return"],
        },
    }


GENERATOR_TEMPLATES = [
    _gen_template_1,
    _gen_template_2,
    _gen_template_3,
    _gen_template_4,
    _gen_template_5,
    _gen_template_6,
]


def generate_challenge(seed: int, tier: int = 9) -> Dict[str, Any]:
    """Procedurally generates a deterministic coding challenge from one of 6 templates."""
    rng = random.Random(seed)
    template_idx = seed % len(GENERATOR_TEMPLATES)
    generator_fn = GENERATOR_TEMPLATES[template_idx]

    payload = generator_fn(rng, seed)

    # Compute solution hash
    sol_hash = hashlib.sha256(payload["reference_solution"].encode("utf-8")).hexdigest()

    return {
        "id": f"gen-{tier}-{seed}",
        "slug": payload["slug"],
        "title": payload["title"],
        "description": payload["description"],
        "tier": tier,
        "topic": "Procedural Logic & Algorithms",
        "starter_code": payload["starter_code"],
        "test_spec": payload["test_spec"],
        "evaluation_spec": payload["evaluation_spec"],
        "reference_solution": payload["reference_solution"],
        "solution_hash": sol_hash,
        "xp_reward": 100 if tier == 9 else 125,
        "seed": seed,
        "generator_id": f"template_{template_idx + 1}",
        "is_generated": True,
    }


def get_daily_challenge_for_user(user_id: str, day_str: str | None = None, tier: int = 9) -> Dict[str, Any]:
    """Generates the deterministic challenge for a given (user, day) pair."""
    if day_str is None:
        day_str = date.today().isoformat()
    seed = seed_for_user_and_day(user_id, day_str)
    return generate_challenge(seed=seed, tier=tier)
