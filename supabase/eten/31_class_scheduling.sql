-- ============================================================================
-- ETEN Mentorship — 31 · Scheduled live classes (Part B, LB-1)
-- ----------------------------------------------------------------------------
-- Run AFTER 30. Idempotent (safe to re-run).
--
-- Turns circle_sessions into schedulable live classes: a start time and a
-- duration. The live-meeting room name is derived from the circle + session ids
-- (no column needed). Existing rows (logged sessions) keep starts_at NULL and
-- behave as before. When a class is scheduled the app also sets session_date to
-- the date of starts_at, so the completion attendance logic (which is
-- join-date-relative) keeps working.
-- ============================================================================

alter table public.circle_sessions
  add column if not exists starts_at        timestamptz,
  add column if not exists duration_minutes int not null default 60;

create index if not exists circle_sessions_starts_at_idx
  on public.circle_sessions (starts_at);
