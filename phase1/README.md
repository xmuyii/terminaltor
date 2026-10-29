# Sovereign Academy LMS — Phase 1: The Core Loop

A lightweight, zero-latency automated coding academy LMS designed for young developers and coding students.

Phase 1 delivers the single critical vertical slice:
> A student logs in via Supabase, picks "Sum of two numbers" from a list, writes `def solve(a,b): return a+b` in Monaco, clicks Run, and sees 5 green checkmarks plus a runtime number in under 1 second.

---

## Architecture & Technology Stack

- **Backend:** Python 3.11+ / FastAPI (fully asynchronous `async`/`await`)
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security, Auth JWTs)
- **Frontend:** Monaco Editor (via CDN) with vanilla HTML5/JS and clean kid-friendly CSS (no build step needed)
- **Execution Engine:** Subprocess isolation with hardened Python runtime (`python -I -S`), guarded `__import__`, AST static logic analysis, and hard 5-second execution timeout.

---

## Directory Layout

```text
phase1/
├── .env.example
├── requirements.txt
├── README.md
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── router.py
│   │       ├── execute.py
│   │       └── challenges.py
│   ├── services/
│   │   ├── executor.py
│   │   └── evaluator.py
│   └── models/
│       └── schemas.py
├── migrations/
│   ├── 001_schema.sql
│   └── 002_seed_challenges.sql
├── static/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── tests/
    ├── test_executor.py
    ├── test_evaluator.py
    └── test_api.py
```

---

## Quickstart Setup Guide

### 1. Database Setup (Supabase)
1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the migrations in order:
   - `migrations/001_schema.sql` (Creates `profiles`, `challenges`, `submissions`, triggers, and RLS policies).
   - `migrations/002_seed_challenges.sql` (Seeds 20 hand-authored challenges across Tiers 1–4 with verified test cases).

### 2. Environment Configuration
Copy the environment template and provide your project keys:
```bash
cp .env.example .env
```
Populate `.env`:
```ini
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql+asyncpg://postgres:your-db-password@db.your-project.supabase.co:5432/postgres"
EXECUTION_TIMEOUT_SECONDS=5
MAX_CODE_SIZE_BYTES=65536
APP_ENV=development
LOG_LEVEL=INFO
```

### 3. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Start the FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Open the Frontend
Navigate your browser to:
[http://localhost:8000/static/index.html](http://localhost:8000/static/index.html)

---

## Testing

Run the test suite with `pytest`:
```bash
pytest -v
```

Tests cover:
- `test_executor.py`: Successful execution, infinite loop timeouts (≤ 5s), blocked dangerous modules (`import os`), missing `solve()`, and oversized code rejection.
- `test_evaluator.py`: AST static verification of functions, return nodes, and forbidden builtins.
- `test_api.py`: `/health`, `/api/v1/challenges`, JWT authorization checks, and end-to-end `/api/v1/execute` validation.

---

## Known Limitations

- **Subprocess Isolation Security:** Subprocess isolation (`python -I -S` with guarded imports) is designed for educational safety and preventing accidental mistakes or system calls. It is **NOT** a hardened hypervisor boundary against adversarial attacks. Phase 1 assumes friendly, authenticated students.
- **Docker/gVisor Sandboxing:** True multi-tenant sandboxing with microVMs or Docker lands in Phase 6.
- **Rate Limiting:** No rate limiting is implemented in Phase 1. Do not expose this service to unauthenticated public traffic without an API gateway or reverse proxy rate limiter.
- **No Async Queue:** `/execute` is synchronous with a hard 5-second timeout. Background job queues (Celery/Redis/BullMQ) are deferred to subsequent scaling phases.
