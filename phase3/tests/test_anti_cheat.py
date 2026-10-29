import asyncio
from uuid import uuid4

from phase3.app.database import (
    _PLAGIARISM_FLAGS,
    _SUBMISSIONS,
    record_submission_transaction,
)
from phase3.app.services.anti_cheat import normalize_code_ast


def test_ast_normalization_variable_renaming():
    """Verifies that variable renaming and comment changes produce identical AST hashes."""
    code1 = """def solve(a, b):
    # This is a comment
    result = a + b
    return result
"""
    code2 = """def solve(x, y):
    total_val = x + y
    return total_val
"""
    _, hash1 = normalize_code_ast(code1)
    _, hash2 = normalize_code_ast(code2)

    assert hash1 == hash2, f"Expected identical AST hashes, got {hash1} vs {hash2}"


async def test_duplicate_paste_flagged_submissions_two_through_five():
    """Core Definition of Done:
    When the student pastes the same solution five times, submissions 2–5
    are flagged in the DB but still scored normally.
    """
    user_id = uuid4()
    challenge_id = uuid4()
    code = """def solve(a: int, b: int) -> int:
    return a + b
"""
    results = [{"index": 0, "passed": True, "input": {"a": 2, "b": 3}, "expected": 5}]

    # Clean DB state for this test run
    initial_flags_count = len(_PLAGIARISM_FLAGS)

    for sub_idx in range(1, 6):
        (
            submission_id,
            is_first_pass,
            awarded_xp,
            profile,
            anti_cheat,
        ) = await record_submission_transaction(
            user_id=user_id,
            challenge_id=challenge_id,
            code=code,
            passed=True,
            execution_ms=15,
            stdout="5",
            stderr="",
            results=results,
            xp_to_award=10,
        )

        # In all 5 submissions, the submission still succeeds and scores normally!
        assert submission_id is not None

        if sub_idx == 1:
            # First submission is clean
            assert anti_cheat["is_flagged"] is False
            assert is_first_pass is True
            assert awarded_xp == 10
        else:
            # Submissions 2, 3, 4, 5 are flagged for review in the DB
            assert anti_cheat["is_flagged"] is True
            assert anti_cheat["flag_type"] == "duplicate_paste"
            # Crucially: still recorded in DB and scored without being blocked
            assert is_first_pass is False

    # Check that submissions 2–5 created 4 audit entries in _PLAGIARISM_FLAGS
    new_flags = len(_PLAGIARISM_FLAGS) - initial_flags_count
    assert new_flags == 4, f"Expected 4 flagged review entries, found {new_flags}"


if __name__ == "__main__":
    test_ast_normalization_variable_renaming()
    asyncio.run(test_duplicate_paste_flagged_submissions_two_through_five())
    print("All anti-cheat and plagiarism tests passed!")
