-- ============================================================================
-- ETEN Mentorship platform — 21 · Two-tier identity + pod-independent Circles
--   (MP-2.3; covers the approved MP-2.1 identity + MP-2.2 circle-model design)
-- ----------------------------------------------------------------------------
-- Run AFTER 01-20. Idempotent (safe to re-run).
--
-- Adds the standalone mentorship product's data model on top of the existing
-- identity, WITHOUT a second accounts system:
--   * Prospect -> ETEN-Validated tier on members (validated_at).
--   * signup_source / mentorship_intent so we know the front door + role.
--   * capability_areas lookup (the 8 domains) as the pod-free organizing axis.
--   * Circles, mentor profiles and mentor applications keyed off capability
--     area instead of a pod (pod stays as an optional legacy link).
--
-- The Circle-running tables (sessions/attendance/assignments/evidence) and the
-- recognition/passport tables are unchanged: they reference circle_id, so the
-- whole engine works pod-free.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.signup_source as enum ('eten', 'mentorship');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mentorship_intent as enum ('mentee', 'mentor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mentor_nomination_source as enum ('nominated', 'self');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- capability_areas — the pod-free axis for mentorship (the 8 domains).
-- Public-readable so registration + browsing can list them; ops manage them.
-- ----------------------------------------------------------------------------
create table if not exists public.capability_areas (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  label      text not null,
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.capability_areas (slug, label, sort_order) values
  ('cloud-infrastructure',   'Cloud & Infrastructure', 1),
  ('modern-work',            'Modern Work / M365',     2),
  ('cybersecurity',          'Cybersecurity',          3),
  ('data-ai',                'Data & AI',              4),
  ('business-applications',  'Business Applications',  5),
  ('software-development',   'Software Development',    6),
  ('digital-transformation', 'Digital Transformation', 7),
  ('technology-leadership',  'Technology Leadership',  8)
on conflict (slug) do nothing;

alter table public.capability_areas enable row level security;

drop policy if exists capability_areas_read on public.capability_areas;
create policy capability_areas_read on public.capability_areas
  for select to anon, authenticated
  using (true);

drop policy if exists capability_areas_write_ops on public.capability_areas;
create policy capability_areas_write_ops on public.capability_areas
  for all to authenticated
  using (public.is_operations())
  with check (public.is_operations());

-- ----------------------------------------------------------------------------
-- members — two-tier identity fields.
--   validated_at IS NULL  => Prospect
--   validated_at IS NOT NULL => ETEN-Validated (full member)
-- ----------------------------------------------------------------------------
alter table public.members
  add column if not exists signup_source public.signup_source not null default 'eten',
  add column if not exists mentorship_intent public.mentorship_intent,
  add column if not exists mentorship_capability_area_id uuid
    references public.capability_areas (id) on delete set null,
  add column if not exists validated_at timestamptz;

-- Backfill: everyone who has completed ETEN membership (has a primary pod) or
-- is operations is Validated. Prospects (no pod) stay null. Re-run safe: it
-- never validates a member who has not onboarded, so it cannot flip a Prospect.
update public.members m
set validated_at = coalesce(m.claimed_at, m.created_at)
where m.validated_at is null
  and (
    m.role = 'operations'
    or exists (
      select 1 from public.profiles p
      where p.member_id = m.id
        and p.primary_specialization_pod_id is not null
    )
  );

-- Helper for gating + RLS (Phase 5 / MP-2.4). Defaults to the caller.
create or replace function public.is_validated(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m
    where m.id = p_uid and m.validated_at is not null
  );
$$;

-- ----------------------------------------------------------------------------
-- mentorship_circles — add capability area, make pod optional.
-- ----------------------------------------------------------------------------
alter table public.mentorship_circles
  add column if not exists capability_area_id uuid
    references public.capability_areas (id) on delete set null;

alter table public.mentorship_circles alter column pod_id drop not null;

-- A Circle must have a home: a pod (legacy) or a capability area (standalone).
do $$ begin
  alter table public.mentorship_circles
    add constraint mentorship_circles_home_chk
    check (pod_id is not null or capability_area_id is not null);
exception when duplicate_object then null; end $$;

create index if not exists mentorship_circles_area_idx
  on public.mentorship_circles (capability_area_id);

-- ----------------------------------------------------------------------------
-- mentor_profiles — verified in a capability area (pod kept as legacy link).
-- ----------------------------------------------------------------------------
alter table public.mentor_profiles
  add column if not exists capability_area_id uuid
    references public.capability_areas (id) on delete set null;

-- ----------------------------------------------------------------------------
-- mentor_nominations — now also serves self-applications from the standalone
-- product. pod nomination = source 'nominated' + pod_id; self-application =
-- source 'self' + capability_area_id. Ops decide either way.
-- ----------------------------------------------------------------------------
alter table public.mentor_nominations
  add column if not exists capability_area_id uuid
    references public.capability_areas (id) on delete set null,
  add column if not exists source public.mentor_nomination_source
    not null default 'nominated';

alter table public.mentor_nominations alter column pod_id drop not null;
