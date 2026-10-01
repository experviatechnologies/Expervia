-- ============================================================================
-- ETEN Mentorship - 33 - Session bookings (Availability AV-4)
-- ----------------------------------------------------------------------------
-- Run AFTER 32. Idempotent (safe to re-run).
--
-- A mentee's request to book a specific availability slot with a mentor. It
-- stays 'pending' until the mentor accepts (AV-5), at which point the booking is
-- turned into a circle_sessions row inside a one_to_one Circle and circle_id /
-- session_id are filled in. Keeping the pending request in its own table means
-- an unaccepted slot never creates a session or holds the calendar.
--
-- Writes go through gated server actions via the service_role key (mentee
-- creates/cancels, mentor/ops decide), so there are no client write policies.
-- Reads: the mentee, the addressed mentor, and operations.
-- ============================================================================

do $$ begin
  create type public.booking_status as enum
    ('pending','accepted','declined','cancelled','expired');
exception when duplicate_object then null; end $$;

create table if not exists public.session_bookings (
  id               uuid primary key default gen_random_uuid(),
  mentor_id        uuid not null references public.members (id) on delete cascade,
  mentee_id        uuid not null references public.members (id) on delete cascade,
  starts_at        timestamptz not null,
  duration_minutes int not null check (duration_minutes between 10 and 240),
  session_type     public.session_type not null default 'standard',
  status           public.booking_status not null default 'pending',
  circle_id        uuid references public.mentorship_circles (id) on delete set null,
  session_id       uuid references public.circle_sessions (id) on delete set null,
  decision_note    text,
  decided_by       uuid references public.members (id) on delete set null,
  decided_at       timestamptz,
  created_at       timestamptz not null default now(),
  constraint session_bookings_not_self check (mentee_id <> mentor_id)
);

create index if not exists session_bookings_mentor_idx
  on public.session_bookings (mentor_id, starts_at);
create index if not exists session_bookings_mentee_idx
  on public.session_bookings (mentee_id, starts_at);

-- A mentee can hold at most one open (pending or accepted) booking for a given
-- mentor + slot; history (declined/cancelled) is kept.
create unique index if not exists session_bookings_one_open_per_slot
  on public.session_bookings (mentee_id, mentor_id, starts_at)
  where status in ('pending','accepted');

alter table public.session_bookings enable row level security;

drop policy if exists session_bookings_select on public.session_bookings;
create policy session_bookings_select on public.session_bookings
  for select to authenticated
  using (
    mentee_id = auth.uid()
    or mentor_id = auth.uid()
    or public.is_operations()
  );
