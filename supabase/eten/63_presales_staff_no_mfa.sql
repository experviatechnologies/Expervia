-- ============================================================================
-- ETEN Presales Tracker - 63 - Staff access without two-step sign-in
-- (16 Nov 2026, owner's decision)
-- ----------------------------------------------------------------------------
-- Run AFTER 62. Safe to re-run. Undoes the database half of migration 53.
--
-- Tracker staff (admins, Sales Managers, Management) now sign in with email
-- and password only, like the admin console. is_presales_staff(), which every
-- staff read policy uses (46, 47), no longer requires an aal2 session.
--
-- RUN THIS BEFORE deploying the matching app change. If the app goes out
-- first, staff get past sign-in but this rule still hides the data, so their
-- tracker pages look empty until this is run. Running it first is harmless:
-- the old app keeps asking for the code until the new one is live.
-- ============================================================================

create or replace function public.is_presales_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_operations()
      or public.has_staff_role('sales_manager')
      or public.has_staff_role('management');
$$;

revoke all on function public.is_presales_staff() from public;
grant execute on function public.is_presales_staff() to authenticated, service_role;
