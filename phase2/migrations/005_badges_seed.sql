-- Phase 2 Badges Seed Data
-- 10 Canonical Motivational Badges for Solves, XP, and Streaks

INSERT INTO public.badges (id, name, description, icon, kind, threshold) VALUES
  ('first_steps',   'First Steps',   'Solve your first challenge',        '🌱', 'solves', 1),
  ('getting_going', 'Getting Going', 'Solve 5 challenges',                '🚀', 'solves', 5),
  ('problem_solver','Problem Solver','Solve 15 challenges',               '🧠', 'solves', 15),
  ('century',       'Century',       'Earn 100 XP',                       '💯', 'xp',     100),
  ('five_hundred',  'High Five',     'Earn 500 XP',                       '✋', 'xp',     500),
  ('two_thousand',  'Scholar',       'Earn 2,000 XP',                     '🎓', 'xp',     2000),
  ('ten_thousand',  'Master',        'Earn 10,000 XP',                    '👑', 'xp',     10000),
  ('three_day',     'On a Roll',     'Maintain a 3-day streak',           '🔥', 'streak', 3),
  ('seven_day',     'Week Warrior',  'Maintain a 7-day streak',           '⚡', 'streak', 7),
  ('thirty_day',    'Unstoppable',   'Maintain a 30-day streak',          '🌟', 'streak', 30)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  kind = EXCLUDED.kind,
  threshold = EXCLUDED.threshold;
