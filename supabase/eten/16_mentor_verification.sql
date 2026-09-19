-- ============================================================================
-- ETEN — 16 · Mentor verification  [Mentorship M1.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–15. Idempotent.
--
-- Pod Leaders nominate a V2+ member of their own pod as a Mentor Candidate; the
-- Verification Desk / Readiness Panel (operations) approves or rejects. On
-- approval a mentor_profiles row is created (status 'verified') and the
-- verified_mentor badge is awarded (handled in the app action). A "capability
-- cell" is a specialist pod.
--
-- Writes go through ops-/pod-lead-gated server actions via service_role — there
-- are no client write policies here (RLS with writes disabled = deny). Reads:
-- nominations are visible to the candidate, the nominating lead, that pod's
-- leads and ops; mentor profiles are visible to any active member (Pod Leaders
-- need to see Verified Mentors to staff Circles, and it's a public credential).
-- ============================================================================

do $$ begin
  create type public.mentor_status as enum
    ('candidate','verified','senior','expert','master');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mentor_nomination_status as enum
    ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- mentor_profiles — one per member; exists once verified, upgraded by the Panel.
-- ----------------------------------------------------------------------------
create table if not exists public.mentor_profiles (
  member_id         uuid primary key references public.members (id) on delete cascade,
  mentor_status     public.mentor_status not null default 'verified',
  capability_pod_id uuid references public.pods (id) on delete set null,
  verified_at       timestamptz,
  verified_by       uuid references public.members (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists mentor_profiles_set_updated_at on public.mentor_profiles;
create trigger mentor_profiles_set_updated_at
  before update on public.mentor_profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- mentor_nominations — a Pod Leader's request; the Panel decides.
-- ----------------------------------------------------------------------------
create table if not exists public.mentor_nominations (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members (id) on delete cascade,
  pod_id          uuid not null references public.pods (id) on delete cascade,
  nominated_by    uuid references public.members (id) on delete set null,
  status          public.mentor_nomination_status not null default 'pending',
  decision_reason text,
  decided_by      uuid references public.members (id) on delete set null,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists mentor_nominations_member_idx
  on public.mentor_nominations (member_id);
create index if not exists mentor_nominations_status_idx
  on public.mentor_nominations (status);

-- One open nomination per member at a time; re-nomination allowed after a
-- decision, history kept.
create unique index if not exists mentor_nominations_one_pending
  on public.mentor_nominations (member_id)
  where status = 'pending';

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.mentor_profiles enable row level security;

drop policy if exists mentor_profiles_select on public.mentor_profiles;
create policy mentor_profiles_select on public.mentor_profiles
  for select to authenticated
  using (public.is_active_member() or public.is_operations());

alter table public.mentor_nominations enable row level security;

drop policy if exists mentor_nominations_select on public.mentor_nominations;
create policy mentor_nominations_select on public.mentor_nominations
  for select to authenticated
  using (
    member_id = auth.uid()
    or nominated_by = auth.uid()
    or public.is_operations()
    or public.is_pod_lead(pod_id)
  );
