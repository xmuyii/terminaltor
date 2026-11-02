from phase3.app.services.rate_limiter import HTTPException, SlidingWindowRateLimiter


def test_rate_limiter_allows_up_to_max():
    limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=10.0)
    key = "student_alpha"

    for i in range(5):
        allowed, remaining, _ = limiter.is_allowed(key)
        assert allowed is True
        assert remaining == 4 - i

    # 6th request is rejected
    allowed, remaining, retry_after = limiter.is_allowed(key)
    assert allowed is False
    assert remaining == 0
    assert retry_after > 0


def test_rate_limiter_enforce_raises_429():
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=5.0)
    key = "student_burst"

    for _ in range(3):
        limiter.enforce(key)

    # 4th request must raise 429
    raised = False
    try:
        limiter.enforce(key)
    except HTTPException as e:
        raised = True
        assert e.status_code == 429
        assert "Rate limit exceeded" in e.detail

    assert raised is True


def test_rate_limiter_resets():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10.0)
    key = "student_reset"

    limiter.enforce(key)
    limiter.enforce(key)

    allowed, _, _ = limiter.is_allowed(key)
    assert allowed is False

    limiter.reset(key)
    allowed, _, _ = limiter.is_allowed(key)
    assert allowed is True


if __name__ == "__main__":
    test_rate_limiter_allows_up_to_max()
    test_rate_limiter_enforce_raises_429()
    test_rate_limiter_resets()
    print("All rate limiter tests passed!")
