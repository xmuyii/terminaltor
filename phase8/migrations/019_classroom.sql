-- ==============================================================================
-- Migration 019: Classroom & Teacher Layer (Phase 8B)
-- Cohorts, Assignments, Gradebook & Role-Based Moderation
-- ==============================================================================

create table if not exists public.cohorts (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references public.profiles(id) on delete cascade,
    name        text not null,
    join_code   text unique not null,
    created_at  timestamptz not null default now(),
    archived_at timestamptz
);

create table if not exists public.cohort_members (
    cohort_id  uuid not null references public.cohorts(id) on delete cascade,
    user_id    uuid not null references public.profiles(id) on delete cascade,
    role       text not null check (role in ('student', 'teacher')),
    joined_at  timestamptz not null default now(),
    primary key (cohort_id, user_id)
);

create table if not exists public.assignments (
    id            uuid primary key default gen_random_uuid(),
    cohort_id     uuid not null references public.cohorts(id) on delete cascade,
    title         text not null,
    description   text,
    challenge_ids uuid[] not null,
    due_at        timestamptz,
    created_at    timestamptz not null default now(),
    created_by    uuid not null references public.profiles(id)
);

create table if not exists public.assignment_progress (
    assignment_id uuid not null references public.assignments(id) on delete cascade,
    user_id       uuid not null references public.profiles(id) on delete cascade,
    solved_count  smallint not null default 0,
    total_count   smallint not null,
    completed_at  timestamptz,
    last_solved_at timestamptz,
    primary key (assignment_id, user_id)
);

create index if not exists idx_cohort_members_user on public.cohort_members (user_id);
create index if not exists idx_cohort_members_cohort on public.cohort_members (cohort_id);
create index if not exists idx_assignments_cohort on public.assignments (cohort_id, due_at desc);
create index if not exists idx_assignment_progress_user on public.assignment_progress (user_id, assignment_id);
create index if not exists idx_cohorts_owner on public.cohorts (owner_id);
create index if not exists idx_cohorts_join_code on public.cohorts (join_code);
