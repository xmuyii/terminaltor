-- Migration 020: Daily Quests (Phase 9A — Retention Mechanics)
-- Deterministic daily quests (3 per day) seeded by (user_id, quest_date) at midnight Africa/Lagos.

CREATE TABLE IF NOT EXISTS public.daily_quests (
  user_id TEXT NOT NULL,
  quest_date DATE NOT NULL,
  quest_index INT NOT NULL CHECK (quest_index IN (0, 1, 2)),
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_xp INT NOT NULL,
  tier_category TEXT NOT NULL CHECK (tier_category IN ('easy', 'medium', 'stretch')),
  target_count INT NOT NULL DEFAULT 1,
  current_count INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, quest_date, quest_index)
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_daily_quests_completed ON public.daily_quests(user_id, completed_at);
