import asyncio
import time
from phase4.app.database import seed_benchmark_submissions
from phase4.app.services.leaderboard import get_leaderboard, invalidate_all_leaderboard_caches


def test_stable_pagination_no_duplicates_pages_1_to_5():
    """Core Definition of Done:
    Rankings are stable: paginating from page 1 to page 5 never shows the same user twice.
    """
    async def _test():
        # Seed 75 users to ensure at least 5 full pages with page_size=10
        seed_benchmark_submissions(num_users=75, submissions_per_user=4)
        await invalidate_all_leaderboard_caches()

        seen_user_ids = set()
        page_size = 10
        pages_to_test = 5

        prev_max_rank = 0

        for page in range(1, pages_to_test + 1):
            resp = await get_leaderboard("all_time", page=page, page_size=page_size, force_refresh=True)
            assert len(resp.entries) == page_size, f"Page {page} should contain exactly {page_size} entries"

            page_user_ids = set()
            for entry in resp.entries:
                u_id_str = str(entry.user_id)
                # CRITICAL: Verify user has not appeared on any previous page
                assert u_id_str not in seen_user_ids, (
                    f"Duplicate user {u_id_str} detected on page {page}! "
                    "Pagination ranking is unstable."
                )
                page_user_ids.add(u_id_str)
                seen_user_ids.add(u_id_str)

                # Verify ranks don't backtrack
                assert entry.rank >= prev_max_rank

            prev_max_rank = resp.entries[-1].rank

        # Total unique users across pages 1 to 5
        assert len(seen_user_ids) == page_size * pages_to_test
        assert resp.total >= 75
        assert resp.total_pages >= 5

    asyncio.run(_test())


def test_benchmark_performance_sub_100ms_under_heavy_load():
    """Core Definition of Done:
    Switching tabs returns results in under 100ms p95 with 10,000 submissions in the database.
    """
    async def _test():
        # Seed 100 users with 100 submissions each = 10,000 submissions
        seed_benchmark_submissions(num_users=100, submissions_per_user=100)
        await invalidate_all_leaderboard_caches()

        timeframes = ["daily", "weekly", "monthly", "all_time"]
        latencies = []

        for tf in timeframes:
            # Measure uncached cold query
            t0 = time.time()
            resp = await get_leaderboard(tf, page=1, page_size=25, force_refresh=True)
            cold_latency_ms = (time.time() - t0) * 1000
            latencies.append(cold_latency_ms)

            assert cold_latency_ms < 100.0, (
                f"Timeframe '{tf}' cold query took {cold_latency_ms:.2f}ms, exceeding 100ms SLA!"
            )
            assert len(resp.entries) > 0

            # Measure cached hot query (which students experience during tab switching)
            t1 = time.time()
            resp_cached = await get_leaderboard(tf, page=1, page_size=25, force_refresh=False)
            hot_latency_ms = (time.time() - t1) * 1000

            assert resp_cached.cached is True
            assert hot_latency_ms < 20.0, (
                f"Timeframe '{tf}' cached tab switch took {hot_latency_ms:.2f}ms, exceeding 20ms SLA!"
            )

        print(f"Benchmark latencies across all 4 timeframes: {[f'{x:.2f}ms' for x in latencies]}")

    asyncio.run(_test())
