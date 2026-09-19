-- ============================================================================
-- ETEN — 15 · Recognition (Expert Score + badges)  [Mentorship foundation M0.3]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–14. Idempotent.
--
-- An append-only recognition ledger. Phase 1 is recognition only (no payment):
-- mentor/mentee badges and Expert Score credit. A member's Expert Score is the
-- SUM of their score_credit points (derived, not a mutable column), and a
-- member "has" a badge if an event with that badge_key exists. The mentorship
-- module (M4) will award into this via service_role; ops can award manually.
--
-- Trust model: records are never self-awarded. RLS lets the owner + ops READ;
-- only operations WRITE directly. Public surfaces (profile) read via
-- service_role, like V-level. Deliberately general (source_type/source_ref, no
-- FK to future tables) so M4 writes without another migration.
-- ============================================================================

do $$ begin
  create type public.recognition_kind as enum ('badge','score_credit');
exception when duplicate_object then null; end $$;

create table if not exists public.recognition_events (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members (id) on delete cascade,
  kind        public.recognition_kind not null,
  badge_key   text,
  points      int,
  label       text not null,
  source_type text,
  source_ref  uuid,
  awarded_by  uuid references public.members (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists recognition_events_member_idx
  on public.recognition_events (member_id);

alter table public.recognition_events enable row level security;

drop policy if exists recognition_select on public.recognition_events;
create policy recognition_select on public.recognition_events
  for select to authenticated
  using (member_id = auth.uid() or public.is_operations());

drop policy if exists recognition_write_ops on public.recognition_events;
create policy recognition_write_ops on public.recognition_events
  for all to authenticated
  using (public.is_operations())
  with check (public.is_operations());
