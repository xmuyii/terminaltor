from phase3.app.data.challenges_phase3 import PHASE3_CHALLENGES


def test_challenge_count_and_tier_distribution():
    """Verifies that exactly 40 challenges exist across Tiers 5-8, 10 per tier."""
    assert len(PHASE3_CHALLENGES) == 40

    tier_counts = {}
    for c in PHASE3_CHALLENGES:
        t = c["tier"]
        tier_counts[t] = tier_counts.get(t, 0) + 1

    assert tier_counts.get(5) == 10, f"Expected 10 in Tier 5, got {tier_counts.get(5)}"
    assert tier_counts.get(6) == 10, f"Expected 10 in Tier 6, got {tier_counts.get(6)}"
    assert tier_counts.get(7) == 10, f"Expected 10 in Tier 7, got {tier_counts.get(7)}"
    assert tier_counts.get(8) == 10, f"Expected 10 in Tier 8, got {tier_counts.get(8)}"


def test_challenge_specs_and_test_cases():
    """Verifies that each challenge has valid required metadata and at least 5 test cases."""
    slugs = set()
    for c in PHASE3_CHALLENGES:
        slug = c["slug"]
        assert slug not in slugs, f"Duplicate slug found: {slug}"
        slugs.add(slug)

        assert "solve" in c["starter_code"]
        assert len(c["test_spec"]) >= 5
        assert c["xp_reward"] >= 35

        for case in c["test_spec"]:
            assert "input" in case
            assert "expected" in case
            assert "weight" in case


if __name__ == "__main__":
    test_challenge_count_and_tier_distribution()
    test_challenge_specs_and_test_cases()
    print("All Phase 3 challenges catalog tests passed! (40 challenges verified)")
