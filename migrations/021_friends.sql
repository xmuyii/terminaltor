-- Migration 021: Friend Rivalries (Phase 9A — Retention Mechanics)
-- Symmetric friendships with maximum 10 friends per student. Dedicated numbers-only leaderboard.

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_friend_pair UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id, status);
