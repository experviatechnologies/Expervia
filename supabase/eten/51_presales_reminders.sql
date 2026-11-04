-- ============================================================================
-- ETEN Presales Tracker - 51 - Reminder log and scheduled-run log
-- (Phase 7, step 7.1, 4 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 50. Idempotent (safe to re-run).
--
-- The tracker's scheduled job (/api/tracker/cron, every 15 minutes) sends
-- reminders and escalations (PRD section 10). Each reminder has a unique key,
-- e.g. "meeting_1h:<seat id>", recorded here BEFORE it is sent, so a reminder
-- goes out once even if runs overlap or are retried.
--
--   presales_reminders  one row per reminder sent (key is the primary key)
--   presales_job_runs   one row per scheduled run: when, how long, what it
--                       did, and any error (shown to admins, step 7.2)
--
-- Both are written by the server only (service_role); admins read them via
-- the admin console, so there are no client policies.
-- ============================================================================

create table if not exists public.presales_reminders (
  key        text primary key,
  kind       text not null,
  request_id uuid references public.presales_requests (id) on delete cascade,
  member_id  uuid references public.members (id) on delete cascade,
  sent_at    timestamptz not null default now()
);

create index if not exists presales_reminders_kind_idx on public.presales_reminders (kind, sent_at);

create table if not exists public.presales_job_runs (
  id          bigint generated always as identity primary key,
  job         text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running' check (status in ('running','succeeded','failed')),
  details     jsonb,
  error       text
);

create index if not exists presales_job_runs_started_idx on public.presales_job_runs (started_at desc);

alter table public.presales_reminders enable row level security;
alter table public.presales_job_runs  enable row level security;
-- No policies: server-written and server-read only (like audit_log).
