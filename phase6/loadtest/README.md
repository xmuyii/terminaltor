# Sovereign Academy LMS — Load Testing Guide (Phase 6)

## Scenarios
1. **`k6_execute.js`**:
   - 50 concurrent virtual students repeatedly submitting solutions every 2 seconds.
   - Enforce p95 enqueue latency < 200ms, p99 enqueue < 500ms, and custom `execute_e2e` p95 < 4.0s.
2. **`k6_leaderboard.js`**:
   - 200 concurrent virtual users querying randomized timeframes (Daily, Weekly, Monthly, All-time) and pages.
   - Enforce p95 response time < 100ms, error rate < 0.5%.

## How to Run
Ensure `k6` is installed (`brew install k6` or `apt install k6`):

```bash
# 1. Run execute queue load test
k6 run -e API_URL=http://localhost:8000 loadtest/k6_execute.js

# 2. Run leaderboard cache stress test
k6 run -e API_URL=http://localhost:8000 loadtest/k6_leaderboard.js
```
