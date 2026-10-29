from phase3.app.services.evaluator_depth import evaluate_logic_depth


def test_evaluator_forbid_nodes():
    code = """def solve(nums):
    i = 0
    while i < len(nums):
        i += 1
    return i
"""
    spec = {
        "required_function": "solve",
        "forbid_nodes": ["While"],
    }
    ok, notes = evaluate_logic_depth(code, spec)
    assert ok is False
    assert any("While" in n for n in notes)


def test_evaluator_require_nodes():
    code = """def solve(a, b):
    return a + b
"""
    spec = {
        "required_function": "solve",
        "require_nodes": ["For"],
    }
    ok, notes = evaluate_logic_depth(code, spec)
    assert ok is False
    assert any("For" in n for n in notes)


def test_evaluator_forbid_calls():
    code = """def solve(arr):
    arr.sort()
    return arr
"""
    spec = {
        "required_function": "solve",
        "forbid_calls": ["sort"],
    }
    ok, notes = evaluate_logic_depth(code, spec)
    assert ok is False
    assert any("sort" in n for n in notes)


def test_evaluator_require_recursion():
    non_recursive = """def solve(n):
    res = 1
    for i in range(1, n + 1):
        res *= i
    return res
"""
    recursive = """def solve(n):
    if n <= 1:
        return 1
    return n * solve(n - 1)
"""
    spec = {
        "required_function": "solve",
        "require_recursion": True,
    }

    ok1, notes1 = evaluate_logic_depth(non_recursive, spec)
    assert ok1 is False
    assert any("recursively" in n for n in notes1)

    ok2, notes2 = evaluate_logic_depth(recursive, spec)
    assert ok2 is True
    assert len(notes2) == 0


def test_evaluator_max_complexity():
    complex_code = """def solve(x):
    if x > 1:
        if x > 2:
            if x > 3:
                if x > 4:
                    return 5
    return 0
"""
    spec = {
        "required_function": "solve",
        "max_complexity": 2,
    }
    ok, notes = evaluate_logic_depth(complex_code, spec)
    assert ok is False
    assert any("Cyclomatic complexity" in n for n in notes)


if __name__ == "__main__":
    test_evaluator_forbid_nodes()
    test_evaluator_require_nodes()
    test_evaluator_forbid_calls()
    test_evaluator_require_recursion()
    test_evaluator_max_complexity()
    print("All evaluator depth tests passed!")
