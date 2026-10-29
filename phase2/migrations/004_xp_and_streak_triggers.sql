-- Phase 2 Triggers: XP Accumulation, Africa/Lagos Streak Calculation & Leaderboard View

-- 1. XP Trigger on Submissions
CREATE OR REPLACE FUNCTION public.apply_submission_xp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.xp_awarded > 0 THEN
    UPDATE public.profiles
       SET total_xp   = total_xp + NEW.xp_awarded,
           updated_at = NOW()
     WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submissions_apply_xp ON public.submissions;
CREATE TRIGGER trg_submissions_apply_xp
  AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.apply_submission_xp();

-- 2. Streak update function (Africa/Lagos calendar day)
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_today    DATE := (NOW() AT TIME ZONE 'Africa/Lagos')::DATE;
  v_last     DATE;
  v_current  INTEGER;
BEGIN
  SELECT (last_active_at AT TIME ZONE 'Africa/Lagos')::DATE, current_streak
    INTO v_last, v_current
    FROM public.profiles
   WHERE id = p_user_id
   FOR UPDATE;

  IF v_last IS NULL OR v_last < v_today - INTERVAL '1 day' THEN
    -- First activity or gap >= 2 days -> reset streak to 1
    v_current := 1;
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    -- Consecutive day activity -> increment streak
    v_current := v_current + 1;
  END IF;
  -- If v_last = v_today, streak remains unchanged (multiple solves in same day)

  UPDATE public.profiles
     SET current_streak = v_current,
         longest_streak = GREATEST(longest_streak, v_current),
         last_active_at = NOW(),
         updated_at     = NOW()
   WHERE id = p_user_id;
END;
$$;

-- 3. All-Time Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard_all_time AS
SELECT
  p.id           AS user_id,
  p.username,
  p.avatar_url,
  p.total_xp     AS points,
  COALESCE(s.challenges_solved, 0) AS challenges_solved,
  p.last_active_at AS last_submission_at,
  RANK() OVER (ORDER BY p.total_xp DESC, p.last_active_at ASC) AS rank
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) AS challenges_solved
    FROM public.submissions
   WHERE is_first_pass = true
   GROUP BY user_id
) s ON s.user_id = p.id
WHERE p.total_xp > 0;
