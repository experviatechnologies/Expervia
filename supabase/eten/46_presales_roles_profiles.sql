-- ============================================================================
-- ETEN Presales Tracker - 46 - Roles, presales profiles, skill levels and
-- purpose-tagged availability (Phase 2, step 2.2)
-- ----------------------------------------------------------------------------
-- Run AFTER 45. Idempotent (safe to re-run). Purely additive: nothing existing
-- is renamed or dropped, so the mentorship product behaves exactly as before.
--
-- Source: Expervia_ETEN_Availability_Tracker_PRD_v1.0 (sections 5, 6, 7, 12).
--
-- What this adds
--   1. member_roles      Sales Manager and Management roles. System
--                        Administrator stays members.role = 'operations'; Pod
--                        Leaders stay pod_memberships.role_in_pod lead/co_lead
--                        (co_lead acts as the backup leader).
--   2. presales_profiles Per-engineer presales preferences: opt-in, seniority,
--                        meeting formats, in-person cities, travel, and when the
--                        availability was last reviewed (freshness, FR-013).
--   3. member_skills.level  Foundational / Working / Advanced / Expert.
--   4. Availability tags  ONE weekly schedule per person (decision 31 Oct 2026):
--                        mentor_availability and its exceptions gain `purposes`
--                        (mentoring / presales), per-window meeting formats and
--                        an active flag, and exceptions gain a reason + note.
--                        Existing rows stay mentoring-only, except whole or
--                        partial BLOCKS (leave, travel), which now apply to both.
--                        mentor_scheduling_prefs.timezone remains the single
--                        source of truth for interpreting the schedule.
--   5. Helper functions + read policies so Sales, Management and the Pod
--      Leaders of an engineer's pods can read what they need. All writes keep
--      going through gated server actions (service_role), as elsewhere.
--
-- Deploy order: run this BEFORE pushing the step 2.4 code (which filters the
-- mentorship booking queries by purpose).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.staff_role as enum ('sales_manager','management');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meeting_format as enum ('online','physical','hybrid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.seniority_level as enum ('associate','mid','senior','principal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.skill_level as enum ('foundational','working','advanced','expert');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.availability_purpose as enum ('mentoring','presales');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.availability_exception_reason as enum
    ('leave','travel','client_work','training','personal','other');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 1. Staff roles (Sales Manager, Management)
-- ----------------------------------------------------------------------------
create table if not exists public.member_roles (
  member_id  uuid not null references public.members (id) on delete cascade,
  role       public.staff_role not null,
  granted_by uuid references public.members (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (member_id, role)
);

create index if not exists member_roles_role_idx on public.member_roles (role);

-- Does the caller hold this staff role?
create or replace function public.has_staff_role(p_role public.staff_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.member_roles r
    join public.members m on m.id = r.member_id
    where r.member_id = auth.uid()
      and r.role = p_role
      and m.status = 'active'
  );
$$;

-- Sales, Management or operations: may read across the whole tracker.
create or replace function public.is_presales_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_operations()
      or public.has_staff_role('sales_manager')
      or public.has_staff_role('management');
$$;

-- Is the caller a lead or co-lead of any pod this member belongs to?
create or replace function public.leads_member(p_member_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.pod_memberships theirs
    join public.pod_memberships mine on mine.pod_id = theirs.pod_id
    where theirs.member_id = p_member_id
      and mine.member_id = auth.uid()
      and mine.role_in_pod in ('lead','co_lead')
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Presales profile (one row per engineer who takes part)
-- ----------------------------------------------------------------------------
create table if not exists public.presales_profiles (
  member_id               uuid primary key references public.members (id) on delete cascade,
  -- Members can step back from presales without leaving ETEN.
  opted_in                boolean not null default true,
  seniority               public.seniority_level,
  formats                 public.meeting_format[] not null default '{online}',
  cities                  text[] not null default '{}',
  willing_to_travel       boolean not null default false,
  travel_notes            text,
  phone                   text,
  specialisations         text[] not null default '{}',
  industries              text[] not null default '{}',
  availability_reviewed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint presales_profiles_formats_nonempty check (cardinality(formats) > 0)
);

drop trigger if exists presales_profiles_set_updated_at on public.presales_profiles;
create trigger presales_profiles_set_updated_at before update on public.presales_profiles
  for each row execute function public.set_updated_at();

create index if not exists presales_profiles_opted_in_idx
  on public.presales_profiles (opted_in) where opted_in;

-- ----------------------------------------------------------------------------
-- 3. Skill level on member skills (null = not yet rated)
-- ----------------------------------------------------------------------------
alter table public.member_skills
  add column if not exists level public.skill_level;

-- ----------------------------------------------------------------------------
-- 4. Purpose-tagged availability (one schedule, mentoring and/or presales)
-- ----------------------------------------------------------------------------
alter table public.mentor_availability
  add column if not exists purposes  public.availability_purpose[] not null default '{mentoring}',
  add column if not exists formats   public.meeting_format[] not null default '{online,physical,hybrid}',
  add column if not exists is_active boolean not null default true;

alter table public.mentor_availability
  drop constraint if exists mentor_availability_purposes_nonempty;
alter table public.mentor_availability
  add constraint mentor_availability_purposes_nonempty check (cardinality(purposes) > 0);
alter table public.mentor_availability
  drop constraint if exists mentor_availability_formats_nonempty;
alter table public.mentor_availability
  add constraint mentor_availability_formats_nonempty check (cardinality(formats) > 0);

alter table public.mentor_availability_exceptions
  add column if not exists purposes public.availability_purpose[] not null default '{mentoring}',
  add column if not exists reason   public.availability_exception_reason,
  add column if not exists note     text;

alter table public.mentor_availability_exceptions
  drop constraint if exists mentor_availability_exc_purposes_nonempty;
alter table public.mentor_availability_exceptions
  add constraint mentor_availability_exc_purposes_nonempty check (cardinality(purposes) > 0);

-- Blocks (leave, travel) are about the person, not the product: apply them to
-- both purposes. Extra-availability rows stay mentoring-only. Re-running is a
-- no-op because the filter only matches rows not yet tagged for presales.
update public.mentor_availability_exceptions
   set purposes = '{mentoring,presales}'
 where kind = 'blocked'
   and not ('presales' = any (purposes));

create index if not exists mentor_availability_purposes_idx
  on public.mentor_availability using gin (purposes);

-- ----------------------------------------------------------------------------
-- 5. Row-level security
-- ----------------------------------------------------------------------------
alter table public.member_roles      enable row level security;
alter table public.presales_profiles enable row level security;

-- Staff roles: you can see your own; operations and presales staff see all
-- (Settings > Users lists them).
drop policy if exists member_roles_select on public.member_roles;
create policy member_roles_select on public.member_roles
  for select to authenticated
  using (member_id = auth.uid() or public.is_presales_staff());

-- Presales profile: owner, presales staff, and Pod Leaders of the member's pods.
drop policy if exists presales_profiles_select on public.presales_profiles;
create policy presales_profiles_select on public.presales_profiles
  for select to authenticated
  using (
    member_id = auth.uid()
    or public.is_presales_staff()
    or public.leads_member(member_id)
  );

-- Availability: in addition to the owner + operations policies from 32, Sales,
-- Management and the member's Pod Leaders may read PRESALES windows and
-- exceptions (needed for matching and nomination). Mentoring-only rows stay
-- private to the mentor and operations.
drop policy if exists mentor_availability_presales_select on public.mentor_availability;
create policy mentor_availability_presales_select on public.mentor_availability
  for select to authenticated
  using (
    'presales' = any (purposes)
    and (public.is_presales_staff() or public.leads_member(mentor_id))
  );

drop policy if exists mentor_availability_exc_presales_select on public.mentor_availability_exceptions;
create policy mentor_availability_exc_presales_select on public.mentor_availability_exceptions
  for select to authenticated
  using (
    'presales' = any (purposes)
    and (public.is_presales_staff() or public.leads_member(mentor_id))
  );

-- Lock down EXECUTE on the new helpers (matches 02_functions.sql).
revoke all on function public.has_staff_role(public.staff_role) from public;
revoke all on function public.is_presales_staff() from public;
revoke all on function public.leads_member(uuid) from public;
grant execute on function public.has_staff_role(public.staff_role) to authenticated, service_role;
grant execute on function public.is_presales_staff() to authenticated, service_role;
grant execute on function public.leads_member(uuid) to authenticated, service_role;
