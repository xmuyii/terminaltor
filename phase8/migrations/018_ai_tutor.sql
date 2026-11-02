-- ==============================================================================
-- Migration 018: AI Tutor & Guided Nudges (Phase 8A)
-- Caching, Rate-Limiting & Guardrailed Hint Storage
-- ==============================================================================

create table if not exists public.hints_cache (
    challenge_id  uuid not null references public.challenges(id) on delete cascade,
    code_hash     text not null,
    level         smallint not null check (level between 1 and 3),
    hint_text     text not null,
    model         text not null,
    tokens_used   integer not null,
    created_at    timestamptz not null default now(),
    primary key (challenge_id, code_hash, level)
);

create table if not exists public.hint_requests (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references public.profiles(id) on delete cascade,
    challenge_id  uuid not null references public.challenges(id) on delete cascade,
    level         smallint not null check (level between 1 and 3),
    code_hash     text not null,
    cache_hit     boolean not null default false,
    tokens_used   integer not null default 0,
    created_at    timestamptz not null default now()
);

create index if not exists idx_hint_requests_user_day
on public.hint_requests
(user_id, (created_at at time zone 'Africa/Lagos')::date);

create index if not exists idx_hint_requests_challenge
on public.hint_requests (challenge_id, created_at desc);

create index if not exists idx_hint_requests_user_challenge
on public.hint_requests (user_id, challenge_id, created_at desc);
