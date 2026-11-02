import time
from collections import defaultdict
from typing import Dict, List, Tuple

try:
    from fastapi import HTTPException, status
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str, headers: dict = None):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
            self.headers = headers or {}

    class status:
        HTTP_429_TOO_MANY_REQUESTS = 429


class SlidingWindowRateLimiter:
    """Sliding-window in-memory and database rate limiter for /execute endpoint."""

    def __init__(self, max_requests: int = 10, window_seconds: float = 10.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Mapping: key -> list of timestamp floats
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> Tuple[bool, int, float]:
        """Checks if request is allowed for key.

        Returns:
          (allowed: bool, remaining_requests: int, retry_after_seconds: float)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Prune timestamps older than window
        timestamps = [t for t in self._requests[key] if t > window_start]
        self._requests[key] = timestamps

        if len(timestamps) >= self.max_requests:
            oldest = timestamps[0]
            retry_after = round((oldest + self.window_seconds) - now, 2)
            return False, 0, max(retry_after, 0.1)

        # Record this request
        self._requests[key].append(now)
        remaining = self.max_requests - len(self._requests[key])
        return True, remaining, 0.0

    def enforce(self, key: str) -> None:
        """Enforces rate limit or raises HTTPException(429)."""
        allowed, _, retry_after = self.is_allowed(key)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} execution requests per {int(self.window_seconds)}s. Try again in {retry_after}s.",
                headers={"Retry-After": str(int(retry_after) + 1)},
            )

    def reset(self, key: str) -> None:
        """Resets the history for a given key (used in tests)."""
        if key in self._requests:
            del self._requests[key]


# Global instance
execution_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=10.0)
