-- Migration 034: Row-Level Security Policies for Academies & Seats
-- Owners manage their academy; active student members can view their academy.

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members ENABLE ROW LEVEL SECURITY;

-- Academies policies:
-- 1. Owners have full management access
CREATE POLICY p_academies_owner_all ON academies
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 2. Enrolled students can read their academy profile
CREATE POLICY p_academies_member_select ON academies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academy_members
      WHERE academy_members.academy_id = academies.id
        AND academy_members.user_id = auth.uid()
        AND academy_members.removed_at IS NULL
    )
  );

-- Academy Members policies:
-- 1. Owner can view and manage seats in their academy
CREATE POLICY p_members_owner_all ON academy_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = academy_members.academy_id
        AND academies.owner_id = auth.uid()
    )
  );

-- 2. Students can view their own membership status and leave their academy
CREATE POLICY p_members_self_read_update ON academy_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY p_members_self_leave ON academy_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
