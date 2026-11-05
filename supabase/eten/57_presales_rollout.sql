-- ============================================================================
-- ETEN Presales Tracker - 57 - Rollout switch (Phase 9, step 9.3)
-- (6 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 56. Safe to re-run.
--
-- Controls who gets the weekly "review your availability" reminder, so the
-- tracker can launch in waves (Admin > Tracker Readiness > Rollout):
--   staff     no weekly reminders to engineers (default, before launch)
--   pilot     only engineers in pilot_pod_ids
--   everyone  every opted-in active engineer
-- Meeting reminders and alerts are unaffected: they only reach people already
-- involved in a request.
-- ============================================================================

alter table public.presales_settings
  add column if not exists rollout_stage text not null default 'staff',
  add column if not exists pilot_pod_ids uuid[] not null default '{}';

do $$ begin
  alter table public.presales_settings
    add constraint presales_settings_rollout_stage
    check (rollout_stage in ('staff', 'pilot', 'everyone'));
exception when duplicate_object then null; end $$;
