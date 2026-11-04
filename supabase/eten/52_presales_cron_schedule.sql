-- ============================================================================
-- ETEN Presales Tracker - 52 - Schedule the tracker's reminder job (pg_cron)
-- (Phase 7, step 7.1, 4 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 51, once the code with /api/tracker/cron is deployed.
-- Safe to re-run: it replaces the existing schedule.
--
-- Supabase calls the tracker every 15 minutes, using pg_cron (scheduler) and
-- pg_net (HTTP from the database). Both are free on Supabase. Vercel Hobby
-- allows only daily crons, so the schedule lives here. Any other scheduler
-- (Vercel Pro, cron-job.org) can call the same endpoint with the same header.
--
-- BEFORE running this file:
--   1. Pick a long random secret and set it as CRON_SECRET in the Vercel
--      project (Settings > Environment Variables), then redeploy.
--   2. Save the same secret and your site URL in Supabase Vault by running,
--      with your own values (once):
--
--        select vault.create_secret('<the same CRON_SECRET>', 'tracker_cron_secret');
--        select vault.create_secret('https://experviatechnologies.com', 'tracker_site_url');
--
-- This file enables the pg_cron and pg_net extensions itself (the same as
-- switching them on under Database > Extensions).
--
-- To stop the schedule later:
--   select cron.unschedule('eten-presales-reminders');
-- ============================================================================

-- 1. Extensions (pg_cron lives in pg_catalog on Supabase; pg_net in extensions).
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 2. The Vault secrets must exist first, or every call would fail silently.
do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'tracker_cron_secret') then
    raise exception 'Missing Vault secret "tracker_cron_secret". Run: select vault.create_secret(''<your CRON_SECRET>'', ''tracker_cron_secret'');';
  end if;
  if not exists (select 1 from vault.decrypted_secrets where name = 'tracker_site_url') then
    raise exception 'Missing Vault secret "tracker_site_url". Run: select vault.create_secret(''https://experviatechnologies.com'', ''tracker_site_url'');';
  end if;
end $$;

-- 3. Replace any existing schedule.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'eten-presales-reminders') then
    perform cron.unschedule('eten-presales-reminders');
  end if;
end $$;

select cron.schedule(
  'eten-presales-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'tracker_site_url') || '/api/tracker/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'tracker_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Check: the job is scheduled and active.
select jobid, jobname, schedule, active from cron.job where jobname = 'eten-presales-reminders';
