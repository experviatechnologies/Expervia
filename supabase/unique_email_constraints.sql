-- Prevent duplicate submissions.
--   * event_registrations : one registration per email.
--   * community_applications : one application per (email, vendor) track — the
--     same person may still apply to both Huawei and Microsoft.
--
-- Run this once in the Supabase SQL Editor. It is safe to re-run (idempotent).
-- The app also normalizes emails to lower-case on write, so casing can never
-- sneak a duplicate past these constraints.

-- 1. Normalize existing emails so the unique indexes below see the same value
--    the app now writes.
update public.event_registrations
  set email = lower(trim(email))
  where email <> lower(trim(email));

update public.community_applications
  set email = lower(trim(email))
  where email <> lower(trim(email));

-- 2. Event registrations: unique on email.
create unique index if not exists event_registrations_email_key
  on public.event_registrations (email);

-- 3. Community applications: unique on (email, vendor).
create unique index if not exists community_applications_email_vendor_key
  on public.community_applications (email, vendor);

-- ---------------------------------------------------------------------------
-- If step 2 or 3 errors with "could not create unique index ... is duplicated",
-- pre-existing duplicate rows exist. DO NOT blindly delete — inspect them first
-- with the queries below, then decide which row to keep (usually the earliest).
--
--   select email, count(*)
--   from public.event_registrations
--   group by email having count(*) > 1;
--
--   select email, vendor, count(*)
--   from public.community_applications
--   group by email, vendor having count(*) > 1;
-- ---------------------------------------------------------------------------
