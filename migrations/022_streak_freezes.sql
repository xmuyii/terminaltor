-- Migration 022: Streak Freezes (Phase 9A — Retention Mechanics)
-- Automatic streak preservation for Premium (1/month) and Pro (3/month) within 36-hour inactivity window.

CREATE TABLE IF NOT EXISTS public.streak_freezes (
  user_id TEXT PRIMARY KEY,
  month_start DATE NOT NULL,
  remaining INT NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ[] DEFAULT '{}'::TIMESTAMPTZ[],
  last_protected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles schema extension for fast retrieval
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freezes_remaining INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_last_protected_at TIMESTAMPTZ;
