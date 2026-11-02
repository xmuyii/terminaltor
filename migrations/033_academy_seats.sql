-- Migration 033: Academy Seats & Student Enrollments
-- Guarantees seat cap enforcement and strictly one active academy per student.

CREATE TABLE IF NOT EXISTS academy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for querying members of an academy
CREATE INDEX IF NOT EXISTS idx_academy_members_academy ON academy_members(academy_id) WHERE removed_at IS NULL;

-- Strict rule: A student may only be an active member of one academy at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_academy_member ON academy_members(user_id) WHERE removed_at IS NULL;
