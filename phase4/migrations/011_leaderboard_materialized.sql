-- ==============================================================================
-- Sovereign Academy LMS — Phase 4 Migration: All-Time Materialized View
-- Scales to 10,000+ submissions under sub-100ms p95 latency SLAs
-- Supports REFRESH MATERIALIZED VIEW CONCURRENTLY via UNIQUE index on user_id
-- ==============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_all_time_mat CASCADE;

CREATE MATERIALIZED VIEW public.leaderboard_all_time_mat AS
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

-- UNIQUE index REQUIRED for concurrent refresh:
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_all_time_mat_user_id
    ON public.leaderboard_all_time_mat (user_id);

-- Compound index for rapid pagination and ranking scans:
CREATE INDEX IF NOT EXISTS idx_leaderboard_all_time_mat_rank_points
    ON public.leaderboard_all_time_mat (rank ASC, points DESC, last_submission_at ASC);

-- Public view alias pointing to the materialized table:
CREATE OR REPLACE VIEW public.leaderboard_all_time AS
SELECT
    user_id,
    username,
    avatar_url,
    points,
    challenges_solved,
    last_submission_at,
    rank
FROM public.leaderboard_all_time_mat;
