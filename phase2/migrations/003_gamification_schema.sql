-- Phase 2 Gamification Schema Migration
-- Extends profiles and submissions, creates badges and user_badges

-- 1. Extend profiles (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_xp       BIGINT   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_total_xp
  ON public.profiles (total_xp DESC, updated_at ASC);

-- 2. Extend submissions for XP audit trail
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS xp_awarded     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_first_pass  BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Unique guard: exactly one first-pass per (user, challenge)
CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_first_pass
  ON public.submissions (user_id, challenge_id)
  WHERE is_first_pass = true;

-- 4. Badges catalog
CREATE TABLE IF NOT EXISTS public.badges (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL,
  xp_threshold  BIGINT,
  kind          TEXT NOT NULL CHECK (kind IN ('xp', 'streak', 'solves')),
  threshold     BIGINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User badges join table
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
  ON public.user_badges (user_id, unlocked_at DESC);

-- Enable RLS on badges and user_badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "User badges insertable by system"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);
