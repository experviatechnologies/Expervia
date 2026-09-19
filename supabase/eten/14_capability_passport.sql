-- ============================================================================
-- ETEN — 14 · Capability passport (evidence log)  [Mentorship foundation M0.2]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–13. Idempotent.
--
-- A member's attested record of demonstrated capability. The mentorship module
-- (later) writes an evidence record here when a mentor signs off evidence or a
-- Circle completes; operations can also add records manually. This is the
-- "Portfolio / Proof Builder" the PRD references.
--
-- Trust model: records are ATTESTED, never self-declared. RLS lets the owning
-- member (and ops) READ; only operations WRITE directly. Modules that write on
-- someone's behalf (e.g. a mentor's sign-off) do so via service_role after
-- their own authorization check. Private to owner + ops for now.
--
-- Deliberately general (source_type/source_ref, no FK to future tables) so the
-- mentorship flows can write to it without another migration.
-- ============================================================================

do $$ begin
  create type public.evidence_category as enum (
    'mentorship','certification','project','assessment','other'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.evidence_records (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members (id) on delete cascade,
  title           text not null,
  description     text,
  category        public.evidence_category not null default 'other',
  capability_area text,
  v_level         smallint check (v_level between 0 and 5),
  source_type     text,
  source_ref      uuid,
  attributed_to   uuid references public.members (id) on delete set null,
  issued_by       uuid references public.members (id) on delete set null,
  occurred_at     date,
  created_at      timestamptz not null default now()
);

create index if not exists evidence_records_member_idx
  on public.evidence_records (member_id);

alter table public.evidence_records enable row level security;

-- Read: the owning member or operations.
drop policy if exists evidence_select on public.evidence_records;
create policy evidence_select on public.evidence_records
  for select to authenticated
  using (member_id = auth.uid() or public.is_operations());

-- Write (insert/update/delete): operations only. Members can never self-add;
-- module writes go through service_role after their own authz.
drop policy if exists evidence_write_ops on public.evidence_records;
create policy evidence_write_ops on public.evidence_records
  for all to authenticated
  using (public.is_operations())
  with check (public.is_operations());
