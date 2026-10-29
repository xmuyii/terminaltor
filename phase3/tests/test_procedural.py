import ast
from phase3.app.services.procedural import (
    GENERATOR_TEMPLATES,
    generate_challenge,
    get_daily_challenge_for_user,
    seed_for_user_and_day,
)


def test_procedural_six_templates_coverage():
    """Verifies that all 6 procedural templates generate valid specifications."""
    for idx in range(len(GENERATOR_TEMPLATES)):
        challenge = generate_challenge(seed=idx, tier=9)
        assert challenge["is_generated"] is True
        assert challenge["generator_id"] == f"template_{idx + 1}"
        assert len(challenge["test_spec"]) >= 3
        assert "def solve" in challenge["starter_code"]
        assert "def solve" in challenge["reference_solution"]
        assert challenge["solution_hash"] is not None


def test_deterministic_seeding_user_and_day():
    """Verifies that the same (user, day) pair always produces identical challenges."""
    user_id = "test-student-uuid-42"
    day = "2026-10-12"

    c1 = get_daily_challenge_for_user(user_id, day, tier=9)
    c2 = get_daily_challenge_for_user(user_id, day, tier=9)

    assert c1["slug"] == c2["slug"]
    assert c1["title"] == c2["title"]
    assert c1["seed"] == c2["seed"]
    assert c1["starter_code"] == c2["starter_code"]
    assert c1["reference_solution"] == c2["reference_solution"]
    assert c1["test_spec"] == c2["test_spec"]


def test_reference_solutions_pass_100_of_100_seeds():
    """Core Definition of Done:
    A reference solution passes 100/100 generated challenges across 100 seeds.
    """
    passed_count = 0
    total_seeds = 100

    for seed in range(total_seeds):
        challenge = generate_challenge(seed=seed, tier=9)
        ref_code = challenge["reference_solution"]
        test_spec = challenge["test_spec"]

        # Compile and execute the reference code in an isolated scope
        scope = {}
        exec(ref_code, scope)
        solve_func = scope["solve"]

        # Run all test cases in this challenge
        all_cases_passed = True
        for case in test_spec:
            inp = case["input"]
            expected = case["expected"]
            actual = solve_func(**inp)
            if actual != expected:
                all_cases_passed = False
                break

        if all_cases_passed:
            passed_count += 1

    assert passed_count == 100, f"Expected 100/100 passes, got {passed_count}/{total_seeds}"


if __name__ == "__main__":
    test_procedural_six_templates_coverage()
    test_deterministic_seeding_user_and_day()
    test_reference_solutions_pass_100_of_100_seeds()
    print("All procedural generator tests passed! (100/100 across 100 seeds)")
