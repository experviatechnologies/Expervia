-- ============================================================================
-- ETEN Phase 1 — 05 · Auth triggers + backfill  (step M0.4)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–04. Idempotent.
--
-- Bridges Supabase Auth (auth.users) to the ETEN identity tables:
--   * on a new auth user  -> create their members + profiles rows
--   * on email confirmation -> stamp members.claimed_at (the account is now
--     "activated"; its profile becomes visible per the RLS in 03_rls.sql)
--
-- Then backfills members/profiles for auth users that predate these triggers
-- (your existing admin accounts), and grants the operations role — REQUIRED so
-- you keep access to /admin once the app gates it by role. EDIT the email(s) in
-- the final statement before running.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- New auth user -> members + profiles.
-- Reads two optional keys from the signup metadata (raw_user_meta_data):
--   full_name : seeds profiles.full_name
--   origin    : 'migrated' for bulk-provisioned accounts; else 'self_signup'
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_origin    public.member_origin;
  v_full_name text;
begin
  v_origin := coalesce(
    nullif(new.raw_user_meta_data->>'origin','')::public.member_origin,
    'self_signup'
  );
  v_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name',''),
    split_part(coalesce(new.email,''), '@', 1)
  );

  insert into public.members (id, origin, claimed_at)
  values (
    new.id,
    v_origin,
    -- already-confirmed at creation (e.g. some invite flows) => claimed now;
    -- otherwise claimed_at is set by the confirmation trigger below.
    case when new.email_confirmed_at is not null then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.profiles (member_id, full_name)
  values (new.id, v_full_name)
  on conflict (member_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- Email confirmed -> claim the account. Fires on any auth.users update and acts
-- only on the null -> not-null transition of email_confirmed_at (robust whether
-- or not that column is treated as generated).
-- ----------------------------------------------------------------------------
create or replace function public.handle_auth_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.members
      set claimed_at = coalesce(claimed_at, now())
      where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_auth_user_confirmed();

-- ----------------------------------------------------------------------------
-- Backfill existing auth users (created before the triggers above).
-- ----------------------------------------------------------------------------
insert into public.members (id, origin, claimed_at)
select u.id, 'self_signup', coalesce(u.email_confirmed_at, now())
from auth.users u
on conflict (id) do nothing;

insert into public.profiles (member_id, full_name)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'full_name',''), split_part(u.email, '@', 1))
from auth.users u
on conflict (member_id) do nothing;

-- ----------------------------------------------------------------------------
-- REQUIRED — grant operations (staff) role to your admin account(s).
-- Without this you will lose access to /admin once the app gates it by role.
-- EDIT the email list, then run this statement.
-- ----------------------------------------------------------------------------
update public.members set role = 'operations'
where id in (
  select id from auth.users
  where email in ('experviatechnologies@gmail.com')
);
