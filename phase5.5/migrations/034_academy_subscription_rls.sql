-- Phase 5.5 Migration 034: Row-Level Security Policies for Academies & Seats
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_academies_owner_all ON academies
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

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

CREATE POLICY p_members_owner_all ON academy_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = academy_members.academy_id
        AND academies.owner_id = auth.uid()
    )
  );

CREATE POLICY p_members_self_read_update ON academy_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY p_members_self_leave ON academy_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
