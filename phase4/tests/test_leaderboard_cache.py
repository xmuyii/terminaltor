import asyncio
from phase4.app.services.cache import cache
from phase4.app.services.leaderboard import (
    get_leaderboard,
    invalidate_all_leaderboard_caches,
    invalidate_timeframe_cache,
)


def test_cache_client_basic_operations():
    """Tests set, get, delete, clear_prefix in CacheClient."""
    async def _test():
        await cache.set("test:key1", {"score": 42}, ex=60)
        val = await cache.get("test:key1")
        assert val == {"score": 42}

        # Clear prefix
        await cache.set("test:key2", {"score": 88}, ex=60)
        cleared = await cache.clear_prefix("test:")
        assert cleared >= 2
        assert await cache.get("test:key1") is None
        assert await cache.get("test:key2") is None

    asyncio.run(_test())


def test_leaderboard_cache_hit_and_invalidation():
    """Verifies that requesting the leaderboard twice yields cached=False then cached=True,

    and that cache invalidation triggers a fresh recomputation.
    """
    async def _test():
        # Step 1: Invalidate existing cache
        await invalidate_timeframe_cache("daily")

        # Step 2: First request -> cache miss
        resp1 = await get_leaderboard("daily", page=1, page_size=10, force_refresh=False)
        assert resp1.cached is False, "First request after invalidation must be a cache miss"

        # Step 3: Second request -> cache hit
        resp2 = await get_leaderboard("daily", page=1, page_size=10, force_refresh=False)
        assert resp2.cached is True, "Second request within TTL must be a cache hit"
        assert resp2.total == resp1.total
        assert len(resp2.entries) == len(resp1.entries)

        # Step 4: Invalidate and verify cache miss again
        await invalidate_timeframe_cache("daily")
        resp3 = await get_leaderboard("daily", page=1, page_size=10, force_refresh=False)
        assert resp3.cached is False, "Request after explicit invalidation must be a cache miss"

    asyncio.run(_test())


def test_cache_keys_timeframe_isolation():
    """Verifies that daily, weekly, monthly, and all-time caches do not contaminate each other."""
    async def _test():
        await invalidate_all_leaderboard_caches()

        r_daily = await get_leaderboard("daily", page=1, page_size=10)
        r_all = await get_leaderboard("all_time", page=1, page_size=10)

        assert r_daily.cached is False
        assert r_all.cached is False

        # Next daily is hit
        r_daily_2 = await get_leaderboard("daily", page=1, page_size=10)
        assert r_daily_2.cached is True

        # Next all_time is hit
        r_all_2 = await get_leaderboard("all_time", page=1, page_size=10)
        assert r_all_2.cached is True

    asyncio.run(_test())
