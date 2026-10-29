# Sovereign Academy LMS — Phase 2: Gamification Layer

Extends the core Phase 1 LMS with a complete motivational loop:
> **Solve a challenge → earn XP → streak increments → badge unlocks → climb the all-time leaderboard.**

---

## What Phase 2 Delivers

1. **First-Pass-Only XP Awarding:**
   - Base XP reward scaled by test pass ratio via `compute_xp(reward, total, passed)`.
   - Idempotency enforced via database unique partial index `uq_submissions_first_pass` on `(user_id, challenge_id) WHERE is_first_pass = true`.
   - Farming prevention: Re-solving already completed challenges awards 0 XP.

2. **Africa/Lagos Calendar Day Streaks:**
   - Streak calculation is handled inside Postgres (`update_streak()`) against the `Africa/Lagos` calendar timezone.
   - Solving consecutive days increments streak. Multiple solves on the same day maintain the streak. Gaps of 2 or more days reset the streak back to 1.

3. **10 Motivational Badges:**
   - Solves milestones: `First Steps 🌱` (1 solve), `Getting Going 🚀` (5 solves), `Problem Solver 🧠` (15 solves).
   - XP thresholds: `Century 💯` (100 XP), `High Five ✋` (500 XP), `Scholar 🎓` (2,000 XP), `Master 👑` (10,000 XP).
   - Streak milestones: `On a Roll 🔥` (3 days), `Week Warrior ⚡` (7 days), `Unstoppable 🌟` (30 days).

4. **All-Time Leaderboard (`GET /api/v1/leaderboard/all_time`):**
   - Public view ranked by total verified challenge XP.
   - Global pagination with stable ranks.
   - Highlights the requesting student with `my_rank`.

5. **Student Dashboard (`profile.html`):**
   - Total XP, current streak flame, challenges solved counter.
   - Visual badges catalog with locked/unlocked states.

---

## Running Phase 2 Migrations

Execute the SQL scripts in order:
```bash
# In Supabase SQL Editor:
1. migrations/003_gamification_schema.sql      # Extends profiles & submissions, creates badges
2. migrations/004_xp_and_streak_triggers.sql    # Trigger for XP, update_streak(), and leaderboard view
3. migrations/005_badges_seed.sql               # Seeds the 10 badges
```

---

## Directory Layout

```text
phase2/
├── migrations/
│   ├── 003_gamification_schema.sql
│   ├── 004_xp_and_streak_triggers.sql
│   └── 005_badges_seed.sql
├── app/
│   ├── services/
│   │   ├── xp.py
│   │   ├── streak.py
│   │   └── badges.py
│   ├── api/v1/
│   │   ├── router.py
│   │   ├── execute.py
│   │   ├── profile.py
│   │   └── leaderboard.py
│   └── models/
│       └── schemas.py
├── static/
│   ├── index.html
│   ├── app.js
│   ├── profile.html
│   ├── leaderboard.html
│   ├── leaderboard.js
│   └── styles.css
└── tests/
    ├── test_xp.py
    ├── test_streak.py
    ├── test_badges.py
    └── test_leaderboard.py
```

---

## Running Phase 2 Tests

```bash
# Run unit tests across all gamification services:
python3 -c "
import asyncio
from phase2.tests.test_xp import test_xp_full_pass, test_xp_partial_credit_math
from phase2.tests.test_streak import test_streak_progression_and_gap_reset
from phase2.tests.test_badges import test_badges_century_unlocked
from phase2.tests.test_leaderboard import test_leaderboard_ranking_and_pagination

test_xp_full_pass()
test_xp_partial_credit_math()
test_streak_progression_and_gap_reset()
asyncio.run(test_badges_century_unlocked())
asyncio.run(test_leaderboard_ranking_and_pagination())
print('All Phase 2 tests passed!')
"
```
