-- ============================================================================
-- ETEN Phase 1 — 10 · Claim on first sign-in  (fixes "A member" name display)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–09. Idempotent.
--
-- PROBLEM: members.claimed_at was only stamped on the email_confirmed_at
-- null->not-null transition. Members who activate via the invite/reset links
-- and then sign in with a password may never hit that transition, so claimed_at
-- stayed NULL. Because profiles_select (03_rls.sql) only reveals a member's
-- profile to *other* members when that member is claimed_at IS NOT NULL AND
-- status = 'active', those members show up everywhere as the "A member"
-- fallback — and, being not is_active_member(), can't see anyone else either.
--
-- FIX: also treat a first successful SIGN-IN as claiming the account. A member
-- who has actually logged in is, by definition, activated. Then backfill every
-- already-signed-in (or already-confirmed) member that slipped through.
--
-- Never-logged-in, pre-provisioned invitees correctly stay unclaimed (private)
-- until they actually come in.
-- ============================================================================

create or replace function public.handle_auth_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Claim on email confirmation OR on first sign-in, whichever happens first.
  if (new.email_confirmed_at is not null and old.email_confirmed_at is null)
     or (new.last_sign_in_at is not null and old.last_sign_in_at is null)
  then
    update public.members
      set claimed_at = coalesce(claimed_at, now())
      where id = new.id;
  end if;
  return new;
end $$;

-- Trigger already exists (after update on auth.users) from 05; the replaced
-- function above is picked up automatically. Recreate defensively in case 05
-- was scoped narrower.
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_auth_user_confirmed();

-- ----------------------------------------------------------------------------
-- Backfill: claim every member who has already signed in or confirmed email.
-- ----------------------------------------------------------------------------
update public.members m
set claimed_at = coalesce(
  m.claimed_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  now()
)
from auth.users u
where u.id = m.id
  and m.claimed_at is null
  and (u.last_sign_in_at is not null or u.email_confirmed_at is not null);
