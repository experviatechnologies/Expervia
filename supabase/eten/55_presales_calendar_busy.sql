-- ============================================================================
-- ETEN Presales Tracker - 55 - Cached free/busy (Phase 8, step 8.2)
-- (5 Nov 2026; PRD "Free/busy checks")
-- ----------------------------------------------------------------------------
-- Run AFTER 54. Safe to re-run.
--
-- The scheduled job (every 15 minutes) reads each connected calendar's busy
-- times for the next 28 days and keeps them here, so the directory and
-- matching screens can show conflicts without calling Microsoft on every page
-- load. Only start and end times are kept: no titles, attendees or details.
-- Selection, re-checks and confirmation still read the calendar live.
--
-- busy        [{ "s": "<utc iso>", "e": "<utc iso>" }, ...]
-- busy_until  how far ahead `busy` covers; meetings after it are unverified
-- busy_synced_at  when it was read; older than an hour counts as unverified
-- ============================================================================

alter table public.presales_calendar_connections
  add column if not exists busy           jsonb not null default '[]',
  add column if not exists busy_until     timestamptz,
  add column if not exists busy_synced_at timestamptz;
