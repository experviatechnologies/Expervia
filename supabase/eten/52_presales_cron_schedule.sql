-- ============================================================================
-- ETEN Presales Tracker - 52 - Schedule the tracker's reminder job (pg_cron)
-- (Phase 7, step 7.1, 4 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 51, once the code with /api/tracker/cron is deployed.
--
-- Supabase calls the tracker every 15 minutes, using pg_cron (scheduler) and
-- pg_net (HTTP from the database). Vercel Hobby allows only one cron a day,
-- so the schedule lives here instead. Any other scheduler (Vercel Pro,
-- cron-job.org) can call the same endpoint with the same header instead.
--
-- BEFORE running this file:
--   1. Database > Extensions: enable "pg_cron" and "pg_net".
--   2. Pick a long random secret and set it as CRON_SECRET in the Vercel
--      project (Settings > Environment Variables), then redeploy.
--   3. Save the same secret and your site URL in Supabase Vault by running,
--      with your own values:
--
--        select vault.create_secret('<the same CRON_SECRET>', 'tracker_cron_secret');
--        select vault.create_secret('https://experviatechnologies.com', 'tracker_site_url');
--
-- Re-running this file replaces the schedule. To stop it:
--   select cron.unschedule('eten-presales-reminders');
-- ============================================================================

select cron.unschedule('eten-presales-reminders')
where exists (select 1 from cron.job where jobname = 'eten-presales-reminders');

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

-- Check: the job is scheduled.
select jobid, jobname, schedule, active from cron.job where jobname = 'eten-presales-reminders';
