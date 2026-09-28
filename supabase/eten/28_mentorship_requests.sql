-- ============================================================================
-- ETEN Mentorship — 28 · 1:1 mentorship requests (boss feedback item 14)
-- ----------------------------------------------------------------------------
-- Run AFTER 27. Idempotent (safe to re-run).
--
-- Adds the mentee-initiated 1:1 request flow that complements the mentor-run
-- Circle engine: a validated mentee sends a request to a verified mentor, who
-- accepts or declines. Writes go through gated server actions via the
-- service_role key (mentee creates, mentor/ops decide) - there are no client
-- write policies. Reads: the mentee, the addressed mentor, and operations.
-- ============================================================================

do $$ begin
  create type public.mentorship_request_status as enum
    ('pending','accepted','declined','withdrawn');
exception when duplicate_object then null; end $$;

create table if not exists public.mentorship_requests (
  id                 uuid primary key default gen_random_uuid(),
  mentee_id          uuid not null references public.members (id) on delete cascade,
  mentor_id          uuid not null references public.members (id) on delete cascade,
  capability_area_id uuid references public.capability_areas (id) on delete set null,
  message            text,
  status             public.mentorship_request_status not null default 'pending',
  decision_note      text,
  decided_by         uuid references public.members (id) on delete set null,
  decided_at         timestamptz,
  created_at         timestamptz not null default now(),
  constraint mentorship_requests_not_self check (mentee_id <> mentor_id)
);

create index if not exists mentorship_requests_mentee_idx
  on public.mentorship_requests (mentee_id);
create index if not exists mentorship_requests_mentor_idx
  on public.mentorship_requests (mentor_id);

-- One open request per mentee -> mentor pair; a new one is allowed after a
-- decision, and history is kept.
create unique index if not exists mentorship_requests_one_pending
  on public.mentorship_requests (mentee_id, mentor_id)
  where status = 'pending';

alter table public.mentorship_requests enable row level security;

drop policy if exists mentorship_requests_select on public.mentorship_requests;
create policy mentorship_requests_select on public.mentorship_requests
  for select to authenticated
  using (
    mentee_id = auth.uid()
    or mentor_id = auth.uid()
    or public.is_operations()
  );
