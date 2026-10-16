-- 42_cleanup_orphan_candidates.sql
--
-- One-off data cleanup (run once in the Supabase SQL editor).
--
-- Context: the migration tool's "to invite" list is built from the source
-- tables `community_applications` + `event_registrations`. It counts anyone in
-- those tables who has no auth account. When unconfirmed accounts were purged,
-- their SOURCE rows stayed behind, so they reappeared as "to invite" (61 of
-- them). This removes those orphaned source rows so the migration preview, the
-- pending-claims panel and the overview all agree.
--
-- Rule: delete any application/event row whose email has no corresponding
-- auth.users account. Rows that belong to a real account (including the staff /
-- recent accounts intentionally kept) are matched by email and are NOT touched.
--
-- Idempotent: re-running it deletes nothing once the orphans are gone.
-- Safe to inspect first: run the two SELECTs, eyeball the counts, then the
-- DELETEs inside the transaction.

-- 1. PREVIEW — how many orphan rows will be removed (run these first).
select count(*) as orphan_applications
from public.community_applications ca
where ca.email is not null
  and lower(trim(ca.email)) not in (
    select lower(u.email) from auth.users u where u.email is not null
  );

select count(*) as orphan_event_registrations
from public.event_registrations er
where er.email is not null
  and lower(trim(er.email)) not in (
    select lower(u.email) from auth.users u where u.email is not null
  );

-- 2. DELETE — remove the orphans. Wrapped in a transaction so it's all-or-nothing.
begin;

delete from public.community_applications ca
where ca.email is not null
  and lower(trim(ca.email)) not in (
    select lower(u.email) from auth.users u where u.email is not null
  );

delete from public.event_registrations er
where er.email is not null
  and lower(trim(er.email)) not in (
    select lower(u.email) from auth.users u where u.email is not null
  );

commit;

-- 3. VERIFY — both should now return 0.
select count(*) as remaining_orphan_applications
from public.community_applications ca
where ca.email is not null
  and lower(trim(ca.email)) not in (
    select lower(u.email) from auth.users u where u.email is not null
  );

select count(*) as remaining_orphan_event_registrations
from public.event_registrations er
where er.email is not null
  and lower(trim(er.email)) not in (
    select lower(u.email) from auth.users u where u.email is not null
  );
