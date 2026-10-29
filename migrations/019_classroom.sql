-- ==============================================================================
-- Migration 019: Classroom & Teacher Layer (Phase 8B)
-- Cohorts, Assignments, Gradebook & Role-Based Moderation
-- ==============================================================================

create table if not exists public.cohorts (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references public.profiles(id) on delete cascade,
    name        text not null,
    join_code   text unique not null,  -- 6-char uppercase alphanumeric (unambiguous)
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

-- Indexes for gradebook and lookup queries
create index if not exists idx_cohort_members_user
on public.cohort_members (user_id);

create index if not exists idx_cohort_members_cohort
on public.cohort_members (cohort_id);

create index if not exists idx_assignments_cohort
on public.assignments (cohort_id, due_at desc);

create index if not exists idx_assignment_progress_user
on public.assignment_progress (user_id, assignment_id);

create index if not exists idx_cohorts_owner
on public.cohorts (owner_id);

create index if not exists idx_cohorts_join_code
on public.cohorts (join_code);

-- Enable Row Level Security (RLS)
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_progress enable row level security;

-- Cohorts Policies
create policy "cohorts_readable_by_members_and_owner"
on public.cohorts for select
using (
    owner_id = auth.uid() or
    exists (select 1 from public.cohort_members cm where cm.cohort_id = id and cm.user_id = auth.uid())
);

create policy "cohorts_insert_by_owner"
on public.cohorts for insert
with check (owner_id = auth.uid());

create policy "cohorts_update_by_owner"
on public.cohorts for update
using (owner_id = auth.uid());

create policy "cohorts_delete_by_owner"
on public.cohorts for delete
using (owner_id = auth.uid());

-- Cohort Members Policies
create policy "cohort_members_readable_by_cohort_members"
on public.cohort_members for select
using (
    user_id = auth.uid() or
    exists (select 1 from public.cohort_members cm where cm.cohort_id = cohort_id and cm.user_id = auth.uid()) or
    exists (select 1 from public.cohorts c where c.id = cohort_id and c.owner_id = auth.uid())
);

create policy "cohort_members_insert_join"
on public.cohort_members for insert
with check (
    user_id = auth.uid() or
    exists (select 1 from public.cohorts c where c.id = cohort_id and c.owner_id = auth.uid())
);

create policy "cohort_members_delete_by_teacher_or_self"
on public.cohort_members for delete
using (
    user_id = auth.uid() or
    exists (select 1 from public.cohorts c where c.id = cohort_id and c.owner_id = auth.uid()) or
    exists (select 1 from public.cohort_members cm where cm.cohort_id = cohort_id and cm.user_id = auth.uid() and cm.role = 'teacher')
);

-- Assignments Policies
create policy "assignments_readable_by_members"
on public.assignments for select
using (
    exists (select 1 from public.cohort_members cm where cm.cohort_id = cohort_id and cm.user_id = auth.uid()) or
    exists (select 1 from public.cohorts c where c.id = cohort_id and c.owner_id = auth.uid())
);

create policy "assignments_write_by_teacher"
on public.assignments for all
using (
    exists (select 1 from public.cohorts c where c.id = cohort_id and c.owner_id = auth.uid()) or
    exists (select 1 from public.cohort_members cm where cm.cohort_id = cohort_id and cm.user_id = auth.uid() and cm.role = 'teacher')
);

-- Assignment Progress Policies
create policy "assignment_progress_readable"
on public.assignment_progress for select
using (
    user_id = auth.uid() or
    exists (
        select 1 from public.assignments a
        join public.cohort_members cm on cm.cohort_id = a.cohort_id
        where a.id = assignment_id and cm.user_id = auth.uid() and cm.role = 'teacher'
    ) or
    exists (
        select 1 from public.assignments a
        join public.cohorts c on c.id = a.cohort_id
        where a.id = assignment_id and c.owner_id = auth.uid()
    )
);

create policy "assignment_progress_platform_update"
on public.assignment_progress for all
using (user_id = auth.uid() or auth.uid() is not null);
