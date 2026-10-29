# Load Test Execution Results (Phase 6 Reference Machine)

**Date**: 2026-10-13  
**Hardware Spec**: 8 vCPU, 16 GB RAM, Ubuntu 22.04 LTS, Docker 26.0  
**Stack**: 2x API (FastAPI / Uvicorn), 4x Worker (Arq), Redis 7 (Cache + Queue)

---

## 1. Execution Pipeline Spike Test (`k6_execute.js`)
- **Virtual Users**: 50 concurrent students
- **Duration**: 60s
- **Total Submissions Enqueued**: 1,482
- **Enqueue Latency (POST /execute)**:
  - p50: 18ms
  - p95: 48ms (SLO: < 200ms) — **PASS**
  - p99: 112ms (SLO: < 500ms) — **PASS**
- **End-to-End Latency (`execute_e2e`)**:
  - p50: 1.2s
  - p95: 2.8s (SLO: < 4.0s) — **PASS**
- **Failed Submissions**: 0 (0.00%) — **PASS**

---

## 2. Multi-Timeframe Leaderboard Stress Test (`k6_leaderboard.js`)
- **Virtual Users**: 200 concurrent users
- **Duration**: 120s
- **Total Requests**: 42,910
- **Response Latency (GET /leaderboard/{tf})**:
  - p50: 14ms
  - p95: 39ms (SLO: < 100ms) — **PASS**
  - p99: 68ms
- **Redis Cache Hit Ratio**: 98.4%
- **Failed Requests**: 0 (0.00%) — **PASS**

---

## 3. Host Stability & Guardrails
- **Worker CPU Max**: 68% (Target: < 80%)
- **Redis Peak Memory**: 118MB (Target: < 512MB)
- **Host OOM Events**: 0
