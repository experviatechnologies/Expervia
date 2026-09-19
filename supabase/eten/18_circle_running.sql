-- ============================================================================
-- ETEN — 18 · Running a Circle  [Mentorship M3.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–17. Idempotent.
--
-- Sessions + attendance, assignments, and evidence submissions for an active
-- Circle. On mentor approval an evidence submission is written to the mentee's
-- capability passport (handled in the app action, M3.4).
--
-- Visibility reuses can_see_circle / is_circle_member (M2.1) plus two small
-- SECURITY DEFINER lookups (circle_of_session / circle_of_assignment). Sessions
-- & assignments are visible to the whole Circle; attendance too (own row
-- always); evidence submissions are visible to the submitting mentee and the
-- mentor/lead/ops only (not peers). Writes go through gated server actions via
-- service_role — no client write policies.
-- ============================================================================

do $$ begin
  create type public.submission_status as enum
    ('submitted','approved','needs_revision');
exception when duplicate_object then null; end $$;

create table if not exists public.circle_sessions (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.mentorship_circles (id) on delete cascade,
  session_date date,
  title        text,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists circle_sessions_circle_idx
  on public.circle_sessions (circle_id);

create table if not exists public.session_attendance (
  session_id uuid not null references public.circle_sessions (id) on delete cascade,
  member_id  uuid not null references public.members (id) on delete cascade,
  attended   boolean not null default false,
  primary key (session_id, member_id)
);

create table if not exists public.circle_assignments (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.mentorship_circles (id) on delete cascade,
  title        text not null,
  instructions text,
  due_date     date,
  created_at   timestamptz not null default now()
);
create index if not exists circle_assignments_circle_idx
  on public.circle_assignments (circle_id);

create table if not exists public.evidence_submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.circle_assignments (id) on delete cascade,
  member_id     uuid not null references public.members (id) on delete cascade,
  content       text,
  status        public.submission_status not null default 'submitted',
  review_note   text,
  reviewed_by   uuid references public.members (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (assignment_id, member_id)
);
create index if not exists evidence_submissions_assignment_idx
  on public.evidence_submissions (assignment_id);
create index if not exists evidence_submissions_member_idx
  on public.evidence_submissions (member_id);

-- ----------------------------------------------------------------------------
-- Circle lookups (SECURITY DEFINER — resolve a child row's circle for RLS).
-- ----------------------------------------------------------------------------
create or replace function public.circle_of_session(p_session_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select circle_id from public.circle_sessions where id = p_session_id;
$$;

create or replace function public.circle_of_assignment(p_assignment_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select circle_id from public.circle_assignments where id = p_assignment_id;
$$;

revoke all on function public.circle_of_session(uuid) from public, anon;
grant execute on function public.circle_of_session(uuid) to authenticated, service_role;
revoke all on function public.circle_of_assignment(uuid) from public, anon;
grant execute on function public.circle_of_assignment(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.circle_sessions enable row level security;
drop policy if exists circle_sessions_select on public.circle_sessions;
create policy circle_sessions_select on public.circle_sessions
  for select to authenticated
  using (public.can_see_circle(circle_id) or public.is_circle_member(circle_id));

alter table public.session_attendance enable row level security;
drop policy if exists session_attendance_select on public.session_attendance;
create policy session_attendance_select on public.session_attendance
  for select to authenticated
  using (
    member_id = auth.uid()
    or public.can_see_circle(public.circle_of_session(session_id))
    or public.is_circle_member(public.circle_of_session(session_id))
  );

alter table public.circle_assignments enable row level security;
drop policy if exists circle_assignments_select on public.circle_assignments;
create policy circle_assignments_select on public.circle_assignments
  for select to authenticated
  using (public.can_see_circle(circle_id) or public.is_circle_member(circle_id));

alter table public.evidence_submissions enable row level security;
drop policy if exists evidence_submissions_select on public.evidence_submissions;
create policy evidence_submissions_select on public.evidence_submissions
  for select to authenticated
  using (
    member_id = auth.uid()
    or public.can_see_circle(public.circle_of_assignment(assignment_id))
  );
