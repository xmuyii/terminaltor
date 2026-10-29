-- Phase 3 Migration: Generated Challenge Columns & Public View
-- Adds seed, generator_id, reference_solution, solution_hash and challenges_public view

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS seed               BIGINT,
  ADD COLUMN IF NOT EXISTS generator_id       TEXT,
  ADD COLUMN IF NOT EXISTS reference_solution TEXT,
  ADD COLUMN IF NOT EXISTS solution_hash      TEXT,
  ADD COLUMN IF NOT EXISTS is_generated       BOOLEAN NOT NULL DEFAULT FALSE;

-- Public view scrubbing reference_solution and solution_hash from student access
CREATE OR REPLACE VIEW public.challenges_public AS
SELECT
  id,
  slug,
  title,
  description,
  tier,
  topic,
  starter_code,
  test_spec,
  evaluation_spec,
  xp_reward,
  is_generated,
  generator_id,
  created_at
FROM public.challenges;

CREATE INDEX IF NOT EXISTS idx_challenges_generated
  ON public.challenges (is_generated, tier);

CREATE INDEX IF NOT EXISTS idx_challenges_generator_id
  ON public.challenges (generator_id)
  WHERE is_generated = true;
