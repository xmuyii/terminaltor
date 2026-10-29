-- ==============================================================================
-- Migration 016: Sovereign Academy Arcade Schema (Game Rounds & Player Scores)
-- ==============================================================================

create table if not exists public.game_rounds (
  id               uuid primary key default gen_random_uuid(),
  mode             text not null check (mode in ('wordforge', 'debugshunting')),
  room_code        text not null,
  language         text not null,
  metadata         jsonb not null,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  player_count     smallint not null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_game_rounds_started
  on public.game_rounds (started_at desc);
create index if not exists idx_game_rounds_mode
  on public.game_rounds (mode, started_at desc);

create table if not exists public.game_round_players (
  round_id      uuid not null references public.game_rounds(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  score         integer not null,
  detail        jsonb not null,
  duration_ms   integer not null,
  submitted_at  timestamptz not null default now(),
  primary key (round_id, user_id)
);

create index if not exists idx_game_round_players_user
  on public.game_round_players (user_id, submitted_at desc);

-- RLS Policies for Game Rounds
alter table public.game_rounds enable row level security;
alter table public.game_round_players enable row level security;

create policy "Game rounds are viewable by everyone"
  on public.game_rounds for select
  using (true);

create policy "Game player results are viewable by everyone"
  on public.game_round_players for select
  using (true);
