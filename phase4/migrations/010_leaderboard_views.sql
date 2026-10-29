-- ==============================================================================
-- Sovereign Academy LMS — Phase 4 Migration: Multi-Timeframe Leaderboard Views
-- Provides 4 uniform views: Daily, Weekly, Monthly, All-Time
-- All views output identical column contracts:
--   user_id, username, avatar_url, points, challenges_solved, last_submission_at, rank
-- ==============================================================================

-- 1. DAILY LEADERBOARD VIEW
-- Aggregates submissions created during current UTC calendar day
CREATE OR REPLACE VIEW public.leaderboard_daily AS
WITH daily_stats AS (
    SELECT
        s.user_id,
        COALESCE(SUM(s.xp_awarded), 0)::BIGINT AS points,
        COUNT(DISTINCT s.challenge_id) FILTER (WHERE s.passed = TRUE)::INTEGER AS challenges_solved,
        MAX(s.created_at) AS last_submission_at
    FROM public.submissions s
    WHERE s.created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
      AND (s.xp_awarded > 0 OR s.passed = TRUE)
    GROUP BY s.user_id
)
SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    ds.points,
    ds.challenges_solved,
    ds.last_submission_at,
    DENSE_RANK() OVER (
        ORDER BY ds.points DESC, ds.last_submission_at ASC, p.id ASC
    )::INTEGER AS rank
FROM daily_stats ds
JOIN public.profiles p ON p.id = ds.user_id
WHERE ds.points > 0;

-- 2. WEEKLY LEADERBOARD VIEW
-- Aggregates submissions created during current UTC calendar week (starting Monday)
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
WITH weekly_stats AS (
    SELECT
        s.user_id,
        COALESCE(SUM(s.xp_awarded), 0)::BIGINT AS points,
        COUNT(DISTINCT s.challenge_id) FILTER (WHERE s.passed = TRUE)::INTEGER AS challenges_solved,
        MAX(s.created_at) AS last_submission_at
    FROM public.submissions s
    WHERE s.created_at >= DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC')
      AND (s.xp_awarded > 0 OR s.passed = TRUE)
    GROUP BY s.user_id
)
SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    ws.points,
    ws.challenges_solved,
    ws.last_submission_at,
    DENSE_RANK() OVER (
        ORDER BY ws.points DESC, ws.last_submission_at ASC, p.id ASC
    )::INTEGER AS rank
FROM weekly_stats ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.points > 0;

-- 3. MONTHLY LEADERBOARD VIEW
-- Aggregates submissions created during current UTC calendar month
CREATE OR REPLACE VIEW public.leaderboard_monthly AS
WITH monthly_stats AS (
    SELECT
        s.user_id,
        COALESCE(SUM(s.xp_awarded), 0)::BIGINT AS points,
        COUNT(DISTINCT s.challenge_id) FILTER (WHERE s.passed = TRUE)::INTEGER AS challenges_solved,
        MAX(s.created_at) AS last_submission_at
    FROM public.submissions s
    WHERE s.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
      AND (s.xp_awarded > 0 OR s.passed = TRUE)
    GROUP BY s.user_id
)
SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    ms.points,
    ms.challenges_solved,
    ms.last_submission_at,
    DENSE_RANK() OVER (
        ORDER BY ms.points DESC, ms.last_submission_at ASC, p.id ASC
    )::INTEGER AS rank
FROM monthly_stats ms
JOIN public.profiles p ON p.id = ms.user_id
WHERE ms.points > 0;

-- 4. ALL-TIME LEADERBOARD VIEW (Live fallback view matching identical column contract)
CREATE OR REPLACE VIEW public.leaderboard_all_time_live AS
WITH all_time_stats AS (
    SELECT
        p.id AS user_id,
        p.username,
        p.avatar_url,
        p.total_xp::BIGINT AS points,
        COUNT(DISTINCT s.challenge_id) FILTER (WHERE s.passed = TRUE)::INTEGER AS challenges_solved,
        COALESCE(MAX(s.created_at), p.last_active_at, p.created_at) AS last_submission_at
    FROM public.profiles p
    LEFT JOIN public.submissions s ON s.user_id = p.id
    WHERE p.total_xp > 0
    GROUP BY p.id, p.username, p.avatar_url, p.total_xp, p.last_active_at, p.created_at
)
SELECT
    user_id,
    username,
    avatar_url,
    points,
    challenges_solved,
    last_submission_at,
    DENSE_RANK() OVER (
        ORDER BY points DESC, last_submission_at ASC, user_id ASC
    )::INTEGER AS rank
FROM all_time_stats;
