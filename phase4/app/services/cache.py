import asyncio
import json
import time
from typing import Any, Dict, Optional, Tuple

from phase4.app.config import settings

# In-memory storage fallback structure: {key: (json_string, expire_timestamp_or_none)}
_MEMORY_STORE: Dict[str, Tuple[str, Optional[float]]] = {}
_MEMORY_LOCK = asyncio.Lock()


class CacheClient:
    """Redis cache client with automatic transparent in-memory fallback.

    Ensures zero runtime errors whether Redis daemon is running or not.
    """

    def __init__(self, redis_url: str = settings.REDIS_URL):
        self.redis_url = redis_url
        self._redis = None
        self._redis_attempted = False
        self._use_redis = False

    async def _init_redis_if_possible(self):
        if self._redis_attempted:
            return
        self._redis_attempted = True
        try:
            import redis.asyncio as aioredis  # type: ignore

            client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=0.2,
                socket_timeout=0.2,
            )
            # Test ping with short timeout
            await client.ping()
            self._redis = client
            self._use_redis = True
        except Exception:
            # Fall back to in-memory store
            self._redis = None
            self._use_redis = False

    async def get(self, key: str) -> Optional[Any]:
        """Gets value from cache. Returns deserialized Python object or None."""
        await self._init_redis_if_possible()

        if self._use_redis and self._redis:
            try:
                raw = await self._redis.get(key)
                if raw is not None:
                    return json.loads(raw)
                return None
            except Exception:
                # On Redis error, fall back to memory
                self._use_redis = False

        # In-memory fallback
        async with _MEMORY_LOCK:
            item = _MEMORY_STORE.get(key)
            if not item:
                return None
            val_str, expires_at = item
            if expires_at is not None and time.time() > expires_at:
                del _MEMORY_STORE[key]
                return None
            try:
                return json.loads(val_str)
            except Exception:
                return val_str

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """Sets value in cache with optional TTL in seconds."""
        await self._init_redis_if_possible()
        val_str = json.dumps(value, default=str)

        if self._use_redis and self._redis:
            try:
                await self._redis.set(key, val_str, ex=ex)
                return True
            except Exception:
                self._use_redis = False

        # In-memory fallback
        async with _MEMORY_LOCK:
            expires_at = (time.time() + ex) if ex is not None else None
            _MEMORY_STORE[key] = (val_str, expires_at)
            return True

    async def delete(self, key: str) -> bool:
        """Deletes key from cache."""
        await self._init_redis_if_possible()
        deleted = False

        if self._use_redis and self._redis:
            try:
                res = await self._redis.delete(key)
                deleted = bool(res)
            except Exception:
                self._use_redis = False

        async with _MEMORY_LOCK:
            if key in _MEMORY_STORE:
                del _MEMORY_STORE[key]
                deleted = True

        return deleted

    async def clear_prefix(self, prefix: str) -> int:
        """Deletes all keys starting with prefix."""
        await self._init_redis_if_possible()
        count = 0

        if self._use_redis and self._redis:
            try:
                cursor = "0"
                while cursor != 0:
                    cursor, keys = await self._redis.scan(cursor=cursor, match=f"{prefix}*", count=100)
                    if keys:
                        count += await self._redis.delete(*keys)
            except Exception:
                self._use_redis = False

        async with _MEMORY_LOCK:
            keys_to_del = [k for k in _MEMORY_STORE if k.startswith(prefix)]
            for k in keys_to_del:
                del _MEMORY_STORE[k]
                count += 1

        return count

    async def flush_all(self) -> bool:
        """Clears all cached entries."""
        async with _MEMORY_LOCK:
            _MEMORY_STORE.clear()
        if self._use_redis and self._redis:
            try:
                await self._redis.flushdb()
            except Exception:
                pass
        return True

    def is_using_redis(self) -> bool:
        return self._use_redis


cache = CacheClient()
