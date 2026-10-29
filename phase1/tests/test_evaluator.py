try:
    import pytest
except ImportError:
    pytest = None
from phase1.app.services.evaluator import evaluate_logic



def test_evaluator_missing_required_function():
    code = "def wrong_name(x):\n    return x\n"
    spec = {"required_function": "solve", "min_args": 1, "max_args": 1}
    ok, notes = evaluate_logic(code, spec)

    assert ok is False
    assert any("Missing required function definition 'solve'" in n for n in notes)


def test_evaluator_flags_forbidden_builtin():
    code = "def solve(x):\n    return eval(x)\n"
    spec = {"required_function": "solve", "forbid_builtins": ["eval", "exec"]}
    ok, notes = evaluate_logic(code, spec)

    assert ok is False
    assert any("forbidden builtin function 'eval'" in n for n in notes)


def test_evaluator_flags_missing_required_node():
    code = "def solve(x):\n    print(x)\n"
    spec = {"required_function": "solve", "require_nodes": ["Return"]}
    ok, notes = evaluate_logic(code, spec)

    assert ok is False
    assert any("required syntax structure 'Return'" in n for n in notes)


def test_evaluator_passes_clean_solution():
    code = "def solve(a, b):\n    return a + b\n"
    spec = {
        "required_function": "solve",
        "min_args": 2,
        "max_args": 2,
        "require_nodes": ["Return"],
        "forbid_builtins": ["eval", "exec"],
    }
    ok, notes = evaluate_logic(code, spec)

    assert ok is True
    assert len(notes) == 0
