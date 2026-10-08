-- ============================================================================
-- ETEN Mentorship - 32 - Mentor availability & scheduling (Availability AV-1)
-- ----------------------------------------------------------------------------
-- Run AFTER 31. Idempotent (safe to re-run).
--
-- Data model for the Mentor Availability & Scheduling feature (Track A of the
-- Availability PRD). Mentors publish a recurring weekly schedule plus
-- date-specific exceptions; the app generates conflict-free bookable slots from
-- it server-side (never exposing the raw calendar to mentees). A booked 1:1
-- session reuses the existing Circle engine: it is a circle_sessions row inside
-- a one_to_one Circle (mentorship_circles.format already supports 'one_to_one').
-- This migration only adds the availability tables + a session_type marker.
--
-- Times are stored in the mentor's OWN timezone (mentor_scheduling_prefs.
-- timezone is the source of truth); slot generation converts to the mentee's
-- local timezone for display.
--
-- Reads are gated to the owning mentor + operations; mentees never read these
-- tables directly - they receive generated slots through a server action. All
-- writes go through gated server actions via the service_role key, so there are
-- no client write policies here (matches 17/18/28).
-- ============================================================================

-- Standard (40-min, free) vs extended (paid, longer) booked session. Track B
-- (Paystack) links payment to the extended type; the column lands now so the
-- booking engine is built against it from the start.
do $$ begin
  create type public.session_type as enum ('standard','extended');
exception when duplicate_object then null; end $$;

alter table public.circle_sessions
  add column if not exists session_type public.session_type not null default 'standard';

-- A mentor's advertised capacity status (shown on their profile; used to gate
-- whether slots are offered at all).
do $$ begin
  create type public.mentor_availability_status as enum
    ('accepting','limited','unavailable');
exception when duplicate_object then null; end $$;

-- An exception either ADDS a one-off available window on a date ('available')
-- or REMOVES time on a date ('blocked'; null start/end = the whole day).
do $$ begin
  create type public.availability_exception_kind as enum ('available','blocked');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Per-mentor scheduling preferences (one row per mentor).
-- ----------------------------------------------------------------------------
create table if not exists public.mentor_scheduling_prefs (
  member_id             uuid primary key references public.members (id) on delete cascade,
  timezone              text    not null default 'UTC',          -- IANA tz, source of truth
  default_session_minutes int   not null default 40 check (default_session_minutes between 10 and 240),
  min_notice_minutes    int     not null default 60 check (min_notice_minutes >= 0),
  buffer_minutes        int     not null default 10  check (buffer_minutes >= 0),
  max_sessions_per_week int     check (max_sessions_per_week is null or max_sessions_per_week > 0),
  availability_status   public.mentor_availability_status not null default 'accepting',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists mentor_scheduling_prefs_set_updated_at on public.mentor_scheduling_prefs;
create trigger mentor_scheduling_prefs_set_updated_at
  before update on public.mentor_scheduling_prefs
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Recurring weekly availability blocks. weekday: 0 = Sunday .. 6 = Saturday.
-- Times are in the mentor's timezone (see prefs).
-- ----------------------------------------------------------------------------
create table if not exists public.mentor_availability (
  id          uuid primary key default gen_random_uuid(),
  mentor_id   uuid not null references public.members (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  constraint mentor_availability_window check (end_time > start_time)
);

create index if not exists mentor_availability_mentor_idx
  on public.mentor_availability (mentor_id, weekday);

-- ----------------------------------------------------------------------------
-- Date-specific exceptions that override the recurring schedule for one date.
-- 'available' must carry a window; 'blocked' with null times blocks the day.
-- ----------------------------------------------------------------------------
create table if not exists public.mentor_availability_exceptions (
  id             uuid primary key default gen_random_uuid(),
  mentor_id      uuid not null references public.members (id) on delete cascade,
  exception_date date not null,
  kind           public.availability_exception_kind not null,
  start_time     time,
  end_time       time,
  created_at     timestamptz not null default now(),
  constraint mentor_availability_exc_window
    check (
      (kind = 'blocked'  and (start_time is null or end_time > start_time))
      or
      (kind = 'available' and start_time is not null and end_time is not null and end_time > start_time)
    )
);

create index if not exists mentor_availability_exc_idx
  on public.mentor_availability_exceptions (mentor_id, exception_date);

-- ----------------------------------------------------------------------------
-- RLS: the owning mentor + operations can read; no client writes.
-- ----------------------------------------------------------------------------
alter table public.mentor_scheduling_prefs        enable row level security;
alter table public.mentor_availability            enable row level security;
alter table public.mentor_availability_exceptions enable row level security;

drop policy if exists mentor_scheduling_prefs_select on public.mentor_scheduling_prefs;
create policy mentor_scheduling_prefs_select on public.mentor_scheduling_prefs
  for select to authenticated
  using (member_id = auth.uid() or public.is_operations());

drop policy if exists mentor_availability_select on public.mentor_availability;
create policy mentor_availability_select on public.mentor_availability
  for select to authenticated
  using (mentor_id = auth.uid() or public.is_operations());

drop policy if exists mentor_availability_exc_select on public.mentor_availability_exceptions;
create policy mentor_availability_exc_select on public.mentor_availability_exceptions
  for select to authenticated
  using (mentor_id = auth.uid() or public.is_operations());
