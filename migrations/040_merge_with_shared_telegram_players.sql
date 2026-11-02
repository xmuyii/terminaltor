-- ==============================================================================
-- NON-DESTRUCTIVE MERGE MIGRATION: SOVEREIGN PYTHON LMS & ARCADE
-- Integrates with existing multi-game ecosystem (Telegram Auth & Shared `players` table)
-- DOES NOT DROP or ALTER any existing columns in `players`, `Dictionary`, or `chess_*`
-- ==============================================================================

-- 1. Ensure `players` table has any missing optional columns without breaking existing data
ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS has_pro_pass BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS coding_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coding_streak SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_coding_active TIMESTAMPTZ;

-- 2. Coding Challenge Progress Table (Linked to `players.user_id` as TEXT)
CREATE TABLE IF NOT EXISTS public.coding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  score INTEGER NOT NULL DEFAULT 0,
  submitted_code TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coding_progress_user_quest UNIQUE (user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_coding_progress_user ON public.coding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_progress_quest ON public.coding_progress(quest_id);

-- 3. Multiplayer Arcade Rounds (Word Forge & Debugs Hunting)
CREATE TABLE IF NOT EXISTS public.coding_game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('wordforge', 'debugshunting')),
  room_code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  player_count SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_game_rounds_mode ON public.coding_game_rounds(mode, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_game_rounds_room ON public.coding_game_rounds(room_code);

-- 4. Multiplayer Round Player Results (Linked to `players.user_id`)
CREATE TABLE IF NOT EXISTS public.coding_game_round_players (
  round_id UUID NOT NULL REFERENCES public.coding_game_rounds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rank SMALLINT,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (round_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coding_round_players_user ON public.coding_game_round_players(user_id, submitted_at DESC);

-- 5. Word Forge & Debugs Hunting Leaderboards
CREATE TABLE IF NOT EXISTS public.coding_arcade_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('wordforge', 'debugshunting')),
  high_score INTEGER NOT NULL DEFAULT 0,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  extra_stats JSONB NOT NULL DEFAULT '{}'::jsonb, -- wordsForged, longestWord, fastestAnswerMs
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coding_leaderboard_user_mode UNIQUE (user_id, mode)
);

CREATE INDEX IF NOT EXISTS idx_coding_lb_mode_score ON public.coding_arcade_leaderboards(mode, high_score DESC);

-- 6. Phase 5.5: Academy Alliances (B2B2C School Subscriptions)
CREATE TABLE IF NOT EXISTS public.coding_academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  join_code TEXT NOT NULL UNIQUE,
  subscription_plan TEXT NOT NULL CHECK (subscription_plan IN ('premium', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'past_due', 'canceled')),
  seats_total INTEGER NOT NULL DEFAULT 30, -- 30 for Premium (₦25k), 100 for Pro (₦75k)
  seats_used INTEGER NOT NULL DEFAULT 0,
  billing_email TEXT,
  paystack_subscription_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_academies_owner ON public.coding_academies(owner_id);
CREATE INDEX IF NOT EXISTS idx_coding_academies_code ON public.coding_academies(join_code);

-- 7. Academy Alliance Memberships (Student Seats)
CREATE TABLE IF NOT EXISTS public.coding_academy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.coding_academies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coding_academy_membership UNIQUE (academy_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coding_academy_members_user ON public.coding_academy_members(user_id);

-- 8. Classroom Cohorts & Assignments
CREATE TABLE IF NOT EXISTS public.coding_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coding_cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.coding_cohorts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coding_cohort_member UNIQUE (cohort_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.coding_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.coding_cohorts(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Daily Quests Tracking
CREATE TABLE IF NOT EXISTS public.coding_daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
  date_str TEXT NOT NULL, -- WAT / Lagos date 'YYYY-MM-DD'
  quests_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coding_user_date UNIQUE (user_id, date_str)
);

-- 10. Atomic Stored Procedure: Deduct 10 Credits For Submission
CREATE OR REPLACE FUNCTION public.spend_arcade_credits(
  p_user_id TEXT,
  p_amount INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  SELECT credits INTO v_current_credits
  FROM public.players
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'player_not_found');
  END IF;

  IF v_current_credits < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'current', v_current_credits);
  END IF;

  v_new_credits := v_current_credits - p_amount;

  UPDATE public.players
  SET credits = v_new_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'balance', v_new_credits);
END;
$$;

-- 11. Atomic Stored Procedure: Claim Daily 100 Free Credits
CREATE OR REPLACE FUNCTION public.claim_daily_credits(
  p_user_id TEXT,
  p_today_str TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_claim TEXT;
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  SELECT credits, last_daily_credit_claim INTO v_current_credits, v_last_claim
  FROM public.players
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'player_not_found');
  END IF;

  IF v_last_claim = p_today_str THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed_today', 'current', v_current_credits);
  END IF;

  v_new_credits := COALESCE(v_current_credits, 0) + 100;

  UPDATE public.players
  SET credits = v_new_credits,
      last_daily_credit_claim = p_today_str,
      last_credit_login = CURRENT_DATE,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'balance', v_new_credits);
END;
$$;

-- 12. Enable Row-Level Security (RLS)
ALTER TABLE public.coding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_game_round_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_arcade_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_academy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_daily_quests ENABLE ROW LEVEL SECURITY;

-- Transparent read policies
CREATE POLICY "Public read coding progress" ON public.coding_progress FOR SELECT USING (true);
CREATE POLICY "Public read game rounds" ON public.coding_game_rounds FOR SELECT USING (true);
CREATE POLICY "Public read game round players" ON public.coding_game_round_players FOR SELECT USING (true);
CREATE POLICY "Public read arcade leaderboards" ON public.coding_arcade_leaderboards FOR SELECT USING (true);
CREATE POLICY "Public read academies" ON public.coding_academies FOR SELECT USING (true);
CREATE POLICY "Public read academy members" ON public.coding_academy_members FOR SELECT USING (true);
CREATE POLICY "Public read cohorts" ON public.coding_cohorts FOR SELECT USING (true);
CREATE POLICY "Public read cohort members" ON public.coding_cohort_members FOR SELECT USING (true);
CREATE POLICY "Public read assignments" ON public.coding_assignments FOR SELECT USING (true);
CREATE POLICY "Public read daily quests" ON public.coding_daily_quests FOR SELECT USING (true);
