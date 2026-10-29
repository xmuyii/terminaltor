#!/usr/bin/env python3
"""Sovereign Academy LMS — Phase 4 Materialized View & Cache Refresh Cron Script.

Runs on scheduled intervals (e.g., every 5 minutes) to:
1. Concurrently refresh the PostgreSQL materialized view:
   REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_all_time_mat;
2. Invalidate expired / stale leaderboard caches in Redis;
3. Pre-warm page 1 of all four timeframes (daily, weekly, monthly, all-time)
   to ensure zero cache-miss latency for classroom students.
"""

import asyncio
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from phase4.app.database import refresh_materialized_view
from phase4.app.services.leaderboard import (
    get_leaderboard,
    invalidate_all_leaderboard_caches,
)


async def main():
    start_time = time.time()
    print("[Cron:Leaderboards] Starting multi-timeframe leaderboard refresh...")

    # Step 1: Refresh PostgreSQL Materialized View
    print("[Cron:Leaderboards] Refreshing materialized view 'leaderboard_all_time_mat'...")
    rows_refreshed = await refresh_materialized_view()
    print(f"[Cron:Leaderboards] Materialized view refreshed successfully ({rows_refreshed} ranked rows).")

    # Step 2: Clear stale Redis cache keys
    print("[Cron:Leaderboards] Invalidating existing Redis cache keys...")
    cleared = await invalidate_all_leaderboard_caches()
    print(f"[Cron:Leaderboards] Invalidation complete ({cleared} key(s) flushed).")

    # Step 3: Pre-warm Page 1 for all timeframes
    timeframes = ["daily", "weekly", "monthly", "all_time"]
    print(f"[Cron:Leaderboards] Pre-warming page 1 cache for timeframes: {timeframes}...")
    for tf in timeframes:
        t0 = time.time()
        resp = await get_leaderboard(timeframe=tf, page=1, page_size=25, force_refresh=True)
        dur = (time.time() - t0) * 1000
        print(f"  - [{tf.upper():<8}] Cached {len(resp.entries)} entries (Total: {resp.total}) in {dur:.2f}ms")

    elapsed_ms = (time.time() - start_time) * 1000
    print(f"[Cron:Leaderboards] Leaderboard refresh completed in {elapsed_ms:.2f}ms. Ready for student traffic.")


if __name__ == "__main__":
    asyncio.run(main())
