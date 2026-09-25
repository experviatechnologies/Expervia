-- ============================================================================
-- ETEN Mentorship platform — 23 · Signup trigger reads mentorship metadata
--   (MP-3.2)
-- ----------------------------------------------------------------------------
-- Run AFTER 21 (needs capability_areas + the new members columns). Idempotent.
--
-- Extends handle_new_auth_user so a mentorship registration (which passes
-- signup_source / mentorship_intent / mentorship_capability_area in the auth
-- metadata) lands on the members row. validated_at stays null => the account
-- is a Prospect until they complete ETEN membership (22's onboarding trigger
-- flips it). Ordinary ETEN signups omit these keys and default to 'eten'.
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_origin    public.member_origin;
  v_full_name text;
  v_source    public.signup_source := 'eten';
  v_intent    public.mentorship_intent;
  v_area_id   uuid;
begin
  v_origin := coalesce(
    nullif(new.raw_user_meta_data->>'origin','')::public.member_origin,
    'self_signup'
  );
  v_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name',''),
    split_part(coalesce(new.email,''), '@', 1)
  );

  -- Optional mentorship metadata (guard bad enum values rather than fail signup).
  begin
    v_source := coalesce(
      nullif(new.raw_user_meta_data->>'signup_source','')::public.signup_source,
      'eten'
    );
  exception when others then v_source := 'eten'; end;

  begin
    v_intent := nullif(new.raw_user_meta_data->>'mentorship_intent','')::public.mentorship_intent;
  exception when others then v_intent := null; end;

  select id into v_area_id
  from public.capability_areas
  where slug = nullif(new.raw_user_meta_data->>'mentorship_capability_area','');

  insert into public.members (
    id, origin, claimed_at,
    signup_source, mentorship_intent, mentorship_capability_area_id
  )
  values (
    new.id,
    v_origin,
    case when new.email_confirmed_at is not null then now() else null end,
    v_source, v_intent, v_area_id
  )
  on conflict (id) do nothing;

  insert into public.profiles (member_id, full_name)
  values (new.id, v_full_name)
  on conflict (member_id) do nothing;

  return new;
end $$;
