-- ============================================================================
-- ETEN Presales Tracker - 50 - Time zone on presales profiles
-- (Phase 4, step 4.2, 1 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 49. Idempotent (safe to re-run).
--
-- Weekly availability is stored as wall-clock times, interpreted in the
-- person's time zone (PRD FR-012). Mentors already keep theirs on
-- mentor_scheduling_prefs.timezone, and because a mentor's schedule is shared
-- between mentoring and presales (migration 46), that remains their source of
-- truth. Engineers who are not mentors have no scheduling-prefs row (creating
-- one would list them in the mentorship admin), so their zone lives here.
--
-- Resolution order used by the app: mentor_scheduling_prefs.timezone, then
-- presales_profiles.timezone, then Africa/Lagos.
-- ============================================================================

alter table public.presales_profiles
  add column if not exists timezone text;

alter table public.presales_profiles
  drop constraint if exists presales_profiles_timezone_format;
alter table public.presales_profiles
  add constraint presales_profiles_timezone_format
    check (timezone is null or timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$');
