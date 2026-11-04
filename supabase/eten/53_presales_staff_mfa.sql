-- ============================================================================
-- ETEN Presales Tracker - 53 - Staff access needs two-step sign-in
-- (Phase 7, step 7.3, 5 Nov 2026; PRD FR-004)
-- ----------------------------------------------------------------------------
-- Run AFTER 46-52. Safe to re-run.
--
-- The app already refuses Sales, Management and admin access in the tracker
-- until the person has entered an authenticator code (session level aal2).
-- This makes the database agree: is_presales_staff(), which every staff read
-- policy uses (46, 47), is only true for an aal2 session.
--
-- Pod Leader and engineer access is unchanged. is_operations() is unchanged
-- here because the wider ETEN member app uses it too; the admin console
-- enforces two-step sign-in in the app.
--
-- Nothing to switch on in Supabase: authenticator app (TOTP) sign-in is on by
-- default (Authentication > Multi-factor in the dashboard).
-- ============================================================================

create or replace function public.is_presales_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     and (
       public.is_operations()
       or public.has_staff_role('sales_manager')
       or public.has_staff_role('management')
     );
$$;

revoke all on function public.is_presales_staff() from public;
grant execute on function public.is_presales_staff() to authenticated, service_role;
