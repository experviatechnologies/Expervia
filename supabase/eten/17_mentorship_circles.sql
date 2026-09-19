-- ============================================================================
-- ETEN — 17 · Mentorship Circles  [Mentorship M2.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–16. Idempotent.
--
-- A Circle: one Verified Mentor supervising 1–10 mentees inside a pod, over a
-- fixed cadence/duration. Each mentee holds a single structured goal (target
-- V-level + capability area). The 1–10 count and "mentor must be Verified" are
-- enforced in the create action (they need cross-row/related-table checks).
-- `format` defaults to 'circle' so Phase 2 (1:1 / project) extends without a
-- table rename.
--
-- Visibility (§4.4-11 / §7): Circle data is visible only to the assigned
-- mentor, enrolled mentees (own record), the owning Pod Leader and ops.
-- SECURITY DEFINER helpers do the cross-table checks (bypassing RLS cleanly).
-- Writes go through gated server actions via service_role — no client write
-- policies here.
-- ============================================================================

do $$ begin
  create type public.circle_status as enum ('draft','active','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.circle_format as enum ('circle','one_to_one','project');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.circle_cadence as enum ('weekly','biweekly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.circle_membership_status as enum
    ('active','completed','withdrawn');
exception when duplicate_object then null; end $$;

create table if not exists public.mentorship_circles (
  id          uuid primary key default gen_random_uuid(),
  pod_id      uuid not null references public.pods (id) on delete cascade,
  mentor_id   uuid not null references public.members (id) on delete restrict,
  title       text,
  format      public.circle_format not null default 'circle',
  cadence     public.circle_cadence not null default 'weekly',
  start_date  date,
  end_date    date,
  status      public.circle_status not null default 'draft',
  created_by  uuid references public.members (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists mentorship_circles_pod_idx
  on public.mentorship_circles (pod_id);
create index if not exists mentorship_circles_mentor_idx
  on public.mentorship_circles (mentor_id);

drop trigger if exists mentorship_circles_set_updated_at on public.mentorship_circles;
create trigger mentorship_circles_set_updated_at
  before update on public.mentorship_circles
  for each row execute function public.set_updated_at();

create table if not exists public.circle_memberships (
  id                uuid primary key default gen_random_uuid(),
  circle_id         uuid not null references public.mentorship_circles (id) on delete cascade,
  member_id         uuid not null references public.members (id) on delete cascade,
  target_v_level    smallint check (target_v_level between 0 and 5),
  target_capability text,
  status            public.circle_membership_status not null default 'active',
  enrolled_at       timestamptz not null default now(),
  unique (circle_id, member_id)
);

create index if not exists circle_memberships_circle_idx
  on public.circle_memberships (circle_id);
create index if not exists circle_memberships_member_idx
  on public.circle_memberships (member_id);

-- ----------------------------------------------------------------------------
-- Visibility helpers (SECURITY DEFINER — bypass RLS to do cross-table checks).
-- ----------------------------------------------------------------------------
create or replace function public.can_see_circle(p_circle_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_operations() or exists (
    select 1 from public.mentorship_circles c
    where c.id = p_circle_id
      and (
        c.mentor_id = auth.uid()
        or c.created_by = auth.uid()
        or public.is_pod_lead(c.pod_id)
      )
  );
$$;

create or replace function public.is_circle_member(p_circle_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.circle_memberships m
    where m.circle_id = p_circle_id and m.member_id = auth.uid()
  );
$$;

revoke all on function public.can_see_circle(uuid) from public, anon;
grant execute on function public.can_see_circle(uuid) to authenticated, service_role;
revoke all on function public.is_circle_member(uuid) from public, anon;
grant execute on function public.is_circle_member(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- RLS — read for participants/leads/ops; writes via service_role only.
-- ----------------------------------------------------------------------------
alter table public.mentorship_circles enable row level security;

drop policy if exists mentorship_circles_select on public.mentorship_circles;
create policy mentorship_circles_select on public.mentorship_circles
  for select to authenticated
  using (public.can_see_circle(id) or public.is_circle_member(id));

alter table public.circle_memberships enable row level security;

drop policy if exists circle_memberships_select on public.circle_memberships;
create policy circle_memberships_select on public.circle_memberships
  for select to authenticated
  using (member_id = auth.uid() or public.can_see_circle(circle_id));
