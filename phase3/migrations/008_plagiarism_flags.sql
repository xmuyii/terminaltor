-- Phase 3 Migration: Plagiarism Flags & Submissions Audit Schema
-- Extends submissions with AST hash and plagiarism flags
-- Adds plagiarism_flags table for SQL review

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS ast_hash          TEXT,
  ADD COLUMN IF NOT EXISTS is_plagiarized    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS plagiarism_reason TEXT,
  ADD COLUMN IF NOT EXISTS similarity_score  NUMERIC(5, 2) DEFAULT 0.0;

CREATE INDEX IF NOT EXISTS idx_submissions_ast_hash
  ON public.submissions (challenge_id, ast_hash);

CREATE INDEX IF NOT EXISTS idx_submissions_plagiarized
  ON public.submissions (is_plagiarized)
  WHERE is_plagiarized = true;

-- Dedicated review table for teachers / SQL auditors
CREATE TABLE IF NOT EXISTS public.plagiarism_flags (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id         UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id          UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  flag_type             TEXT NOT NULL, -- 'duplicate_paste', 'structural_similarity', 'shared_ast'
  similarity_score      NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  matched_submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  details               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plagiarism_flags_user
  ON public.plagiarism_flags (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plagiarism_flags_challenge
  ON public.plagiarism_flags (challenge_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.plagiarism_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plagiarism flags viewable by system and admin"
  ON public.plagiarism_flags FOR SELECT
  USING (true);
