# Sovereign Academy LMS — Deployment Guide: GitHub & Railway

This guide walks you through pushing the entire codebase to **GitHub** and deploying it to **Railway** (PostgreSQL + Redis + FastAPI + React frontend in a single coordinated stack).

---

## 1. Push to GitHub

### Step 1.1: Initialize Git and Check Status
From the repository root folder on your local machine:

```bash
# Initialize git (if not already initialized)
git init

# Verify git status and ensure untracked files are detected
git status
```

### Step 1.2: Add Files & Create Initial Commit
```bash
# Stage all files (node_modules, .env secrets, and __pycache__ are already ignored in .gitignore)
git add .

# Create the initial commit
git commit -m "feat: Sovereign Academy LMS with Phase 1-4 multi-timeframe leaderboards"
```

### Step 1.3: Link Remote & Push to GitHub
1. Go to [github.com/new](https://github.com/new) and create a repository (e.g. `sovereign-academy-lms`).
2. Do **not** check "Initialize with README" since you already have local files.
3. Run the following in your terminal:

```bash
# Rename branch to main
git branch -M main

# Add your GitHub repository as remote origin (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/sovereign-academy-lms.git

# Push code to GitHub
git push -u origin main
```

*(If you use GitHub CLI: simply run `gh repo create sovereign-academy-lms --public --source=. --remote=origin --push`)*

---

## 2. Deploy on Railway

Railway supports instant multi-service projects with managed PostgreSQL and Redis.

### Step 2.1: Create a Railway Project
1. Log in to [railway.app](https://railway.app/).
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"** and choose `sovereign-academy-lms`.
4. Railway will automatically detect the `Dockerfile` and `railway.json`.

### Step 2.2: Add Managed PostgreSQL (Database)
1. Inside your Railway project canvas, click **"+ Create"** (or press `Cmd/Ctrl + K`).
2. Select **"Database"** → **"Add PostgreSQL"**.
3. Railway automatically generates connection variables (`DATABASE_URL`, `PGHOST`, `PGPORT`, etc.).

### Step 2.3: Add Managed Redis (Cache)
1. In the same project canvas, click **"+ Create"** → **"Database"** → **"Add Redis"**.
2. Railway provides `REDIS_URL` (e.g. `redis://default:password@redis.railway.internal:6379`).

### Step 2.4: Connect Environment Variables to Your Web Service
In Railway's canvas, select your **Web Service** (the GitHub deployment) → go to the **"Variables"** tab:
1. Click **"Add Reference"** and select:
   - `REDIS_URL` → points to Redis service's `REDIS_URL`.
   - `DATABASE_URL` → points to Postgres service's `DATABASE_URL`.
2. Add the custom LMS variables:
   ```env
   LEADERBOARD_CACHE_TTL_DAILY=60
   LEADERBOARD_CACHE_TTL_WEEKLY=300
   LEADERBOARD_CACHE_TTL_MONTHLY=900
   LEADERBOARD_CACHE_TTL_ALL_TIME=3600
   LEADERBOARD_PAGE_SIZE_DEFAULT=25
   LEADERBOARD_PAGE_SIZE_MAX=100
   CORS_ORIGINS=*
   ```
3. Under the **"Settings"** tab, verify **Networking** → click **"Generate Domain"** to get a public HTTPS URL (e.g. `sovereign-lms-production.up.railway.app`).

---

## 3. Run Database Migrations

You can run the SQL migrations directly in Railway:

1. Click the **PostgreSQL** service in Railway.
2. Go to the **"Data"** or **"Query"** tab (or connect via any Postgres client using the public connection string).
3. Execute the migration scripts in sequence:
   - `phase1/migrations/` (if using custom DB tables)
   - `phase2/migrations/`
   - `phase3/migrations/`
   - `phase4/migrations/010_leaderboard_views.sql` (Daily, Weekly, Monthly, All-time views)
   - `phase4/migrations/011_leaderboard_materialized.sql` (Concurrent materialized view & refresh function)
   - `phase4/migrations/012_leaderboard_indexes.sql` (Performance indexes for sub-100ms response times)

---

## 4. How to Integrate with Your Existing Platform Later

When you are ready to link Sovereign Academy LMS with your main existing platform (e.g. Next.js, Django, WordPress, Moodle, or custom frontend), you have 3 clean integration approaches:

### Option A: Seamless Iframe Embed (Fastest — 10 minutes)
Embed the LMS sandbox or leaderboards directly into your existing student portal:
```html
<iframe 
  src="https://sovereign-lms-production.up.railway.app" 
  width="100%" 
  height="850px" 
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

### Option B: Shared JWT Authentication (Recommended)
Pass your existing platform's logged-in student user session to the LMS:
1. Your existing platform signs a JWT containing `{ "sub": user_id, "username": username, "email": email }` using a shared `JWT_SECRET`.
2. Your frontend attaches this token in API requests:
   ```javascript
   fetch("https://sovereign-lms-production.up.railway.app/api/v1/leaderboard/daily?include_me=true", {
     headers: {
       "Authorization": `Bearer ${userJwtToken}`
     }
   })
   ```
3. The LMS automatically identifies the student and returns their real-time rank.

### Option C: Headless API Integration (Custom UI)
If your existing platform already has its own UI design and only needs the high-speed code execution engine and multi-timeframe leaderboards, you can call the FastAPI endpoints directly:
- `GET /api/v1/leaderboard/{timeframe}?page=1&page_size=25` (Daily, Weekly, Monthly, All-Time)
- `POST /api/v1/execute` (Sandboxed code execution + AST checks + XP awards)
- `GET /api/v1/challenges` (Tier 1-10 challenges)
