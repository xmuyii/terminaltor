# Sovereign Academy LMS — Phase 3: Content Depth & Anti-Cheat

Extends the working Phase 2 LMS with substantial catalog expansion and platform hardening:
> **Tiers 5–8 hand-authored challenges + Tier 9–10 deterministic procedural generator + AST-level anti-cheat plagiarism review + Sliding-window rate limiter + Expanded evaluator depth.**

---

## What Phase 3 Delivers

1. **40 New Hand-Authored Challenges (Tiers 5–8):**
   - **Tier 5: Data Structures & Advanced Lists (10 challenges, 35 XP each):** List flattening, rotating by k, chunking, unique in order, interleaving, cumulative sum, pairwise difference, matrix transpose, peak detection, consecutive zeros.
   - **Tier 6: Strings & Text Parsing (10 challenges, 45 XP each):** Camel to snake case, vowel/consonant count, anagram validator, word truncation, Caesar cipher, IPv4 validation, consecutive character compression, domain extraction, word frequency rank, reverse word order.
   - **Tier 7: Dictionaries & Frequency Maps (10 challenges, 60 XP each):** Dictionary inverter, dictionary merge with sum, most frequent element, group by length, nested dictionary path retrieval, threshold filtering, dictionary diff, vote tallying, two-sum index mapping, cache hit/miss counter.
   - **Tier 8: Recursion & Divide-and-Conquer (10 challenges, 80 XP each):** Recursive power, palindrome verification, nested numeric sum, binary search, Euclidean GCD, deep flattening, tree leaf counter, Tower of Hanoi moves, string permutations, climbing stairs recurrence.

2. **Procedural Challenge Generator (Tiers 9–10):**
   - 6 Algorithmic Templates: Sliding Window Maximum, Run-Length Token Compressor, Matrix Spiral Traversal, Interval Schedule Merger, Network Shortest Route (BFS), and Balanced Parentheses Scorer.
   - Deterministic Seeding: Uses `seed_for_user_and_day(user_id, day_str)` so the exact same `(user, day)` pair always yields the identical challenge.
   - Certified Reference Solutions: Guaranteed **100/100 passes across 100 seeds**.

3. **AST-Level Plagiarism Detection & Anti-Cheat:**
   - Normalizes variable names, argument names, and strips docstrings/comments.
   - Generates deterministic SHA-256 AST structural hashes (`ast_hash`).
   - Duplicate Paste Auditing: When a student pastes the same solution 5 times, submissions 2–5 are flagged in `submissions` and `plagiarism_flags` in the DB for review, but **still scored normally** (never blocked).

4. **Sliding-Window Rate Limiter:**
   - Guards the `/api/v1/execute` endpoint against automated spamming or brute-force hammering.
   - Enforces max 10 requests per 10-second window.
   - Returns HTTP `429 Too Many Requests` with a `Retry-After` header when exceeded.

5. **Evaluator Depth:**
   - Expands AST validation with `forbid_nodes`, `require_nodes`, `forbid_calls`, `require_recursion`, and `max_complexity`.

---

## Running Phase 3 Migrations

Execute the SQL scripts in order:
```bash
# In Supabase SQL Editor:
1. migrations/006_challenges_phase3.sql             # Seeds 40 challenges across Tiers 5–8
2. migrations/007_generated_challenge_columns.sql   # Adds procedural columns and scrubbed public view
3. migrations/008_plagiarism_flags.sql              # Extends submissions and creates plagiarism_flags review table
4. migrations/009_rate_limiting.sql                 # Creates rate_limits tracking table and cleanup function
```

---

## Directory Layout

```text
phase3/
├── migrations/
│   ├── 006_challenges_phase3.sql
│   ├── 007_generated_challenge_columns.sql
│   ├── 008_plagiarism_flags.sql
│   └── 009_rate_limiting.sql
├── app/
│   ├── api/v1/
│   │   ├── router.py
│   │   ├── execute.py
│   │   └── challenges.py
│   ├── data/
│   │   └── challenges_phase3.py
│   ├── models/
│   │   └── schemas.py
│   ├── services/
│   │   ├── procedural.py
│   │   ├── anti_cheat.py
│   │   ├── rate_limiter.py
│   │   └── evaluator_depth.py
│   └── database.py
├── tests/
│   ├── test_procedural.py
│   ├── test_anti_cheat.py
│   ├── test_rate_limiter.py
│   ├── test_evaluator_depth.py
│   └── test_phase3_challenges.py
└── README.md
```

---

## Running Phase 3 Verification Tests

```bash
python3 -c "
import asyncio
from phase3.tests.test_procedural import (
    test_procedural_six_templates_coverage,
    test_deterministic_seeding_user_and_day,
    test_reference_solutions_pass_100_of_100_seeds
)
from phase3.tests.test_anti_cheat import (
    test_ast_normalization_variable_renaming,
    test_duplicate_paste_flagged_submissions_two_through_five
)
from phase3.tests.test_rate_limiter import (
    test_rate_limiter_allows_up_to_max,
    test_rate_limiter_enforce_raises_429,
    test_rate_limiter_resets
)
from phase3.tests.test_evaluator_depth import (
    test_evaluator_forbid_nodes,
    test_evaluator_require_nodes,
    test_evaluator_forbid_calls,
    test_evaluator_require_recursion,
    test_evaluator_max_complexity
)
from phase3.tests.test_phase3_challenges import (
    test_challenge_count_and_tier_distribution,
    test_challenge_specs_and_test_cases
)

test_procedural_six_templates_coverage()
test_deterministic_seeding_user_and_day()
test_reference_solutions_pass_100_of_100_seeds()
test_ast_normalization_variable_renaming()
asyncio.run(test_duplicate_paste_flagged_submissions_two_through_five())
test_rate_limiter_allows_up_to_max()
test_rate_limiter_enforce_raises_429()
test_rate_limiter_resets()
test_evaluator_forbid_nodes()
test_evaluator_require_nodes()
test_evaluator_forbid_calls()
test_evaluator_require_recursion()
test_evaluator_max_complexity()
test_challenge_count_and_tier_distribution()
test_challenge_specs_and_test_cases()
print('All Phase 3 verification tests passed successfully!')
"
```
