-- ==============================================================================
-- Migration 017: Arcade Real-time & Multi-Timeframe Leaderboard Views
-- ==============================================================================

create or replace view public.game_leaderboard_all_time as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  sum(g.score)::bigint as total_score,
  count(*) as rounds_played,
  max(g.score) as best_round,
  rank() over (order by sum(g.score) desc, count(*) desc) as rank
from public.game_round_players g
join public.profiles p on p.id = g.user_id
group by p.id, p.username, p.avatar_url;

create or replace view public.game_leaderboard_wordforge as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  sum(g.score)::bigint as total_score,
  count(*) as rounds_played,
  max(g.score) as best_round,
  rank() over (order by sum(g.score) desc, count(*) desc) as rank
from public.game_round_players g
join public.game_rounds r on r.id = g.round_id
join public.profiles p on p.id = g.user_id
where r.mode = 'wordforge'
group by p.id, p.username, p.avatar_url;

create or replace view public.game_leaderboard_debugshunting as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  sum(g.score)::bigint as total_score,
  count(*) as rounds_played,
  max(g.score) as best_round,
  rank() over (order by sum(g.score) desc, count(*) desc) as rank
from public.game_round_players g
join public.game_rounds r on r.id = g.round_id
join public.profiles p on p.id = g.user_id
where r.mode = 'debugshunting'
group by p.id, p.username, p.avatar_url;

-- Daily variants following Phase 4 timezone conventions (Africa/Lagos)
create or replace view public.game_leaderboard_daily as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  sum(g.score)::bigint as total_score,
  count(*) as rounds_played,
  max(g.score) as best_round,
  rank() over (order by sum(g.score) desc, count(*) desc) as rank
from public.game_round_players g
join public.game_rounds r on r.id = g.round_id
join public.profiles p on p.id = g.user_id
where r.started_at >= (date_trunc('day', now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos')
group by p.id, p.username, p.avatar_url;
