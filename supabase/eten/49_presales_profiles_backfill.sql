-- ============================================================================
-- ETEN Presales Tracker - 49 - Presales profiles for engineers
-- (Phase 3, step 3.3, 1 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 48. Idempotent (safe to re-run): profiles are only created where
-- none exists, so nothing an engineer has already edited is overwritten.
--
-- Decision (31 Oct 2026): engineers are OPTED IN by default and can step back
-- in their settings. Nobody is selectable for a meeting until they declare
-- presales availability, so opting in does not book anyone.
--
-- Who: every ACTIVE member of at least one specialist pod (the Main
-- Community alone does not count; those members stay out of the tracker).
--
-- Defaults derived from the existing profile:
--   seniority  from years_experience: 12+ principal, 7+ senior, 4+ mid,
--              under 4 associate; unknown years stay NULL (not guessed).
--   formats    online only; in-person is never assumed.
--   cities     the city from profiles.location, normalised: Lagos spellings
--              and Lagos districts become "Lagos"; a country on its own is
--              skipped; anything else is title-cased.
--
-- A trigger keeps this current: joining a specialist pod later creates the
-- profile the same way.
-- ============================================================================

-- Derive a presales city from free-text profile location.
create or replace function public.presales_city_from_location(p_location text)
returns text
language sql immutable
as $$
  with first as (
    select lower(trim(regexp_replace(split_part(coalesce(p_location, ''), ',', 1), '[.]+$', ''))) as v
  )
  select case
    when v = '' then null
    when v ~ '^(nigeria|ghana|kenya|uganda|rwanda|pakistan|india|south africa|united kingdom|uk|usa|united states|canada)$' then null
    when v ~ '(^|\s)lagos(\s|$)'
      or v ~ '^(ikeja|ikorodu|surulere|isolo|ogba|lekki|alagbado|yaba|ajah|victoria island|vi|ikoyi|maryland|gbagada|festac|egbeda|agege|oshodi|magodo|ojota|ketu|apapa|mushin|ojo|ipaja|sangotedo)$'
      then 'Lagos'
    else initcap(v)
  end
  from first;
$$;

-- Seniority from years of experience (NULL when unknown).
create or replace function public.presales_seniority_from_years(p_years int)
returns public.seniority_level
language sql immutable
as $$
  select case
    when p_years is null then null
    when p_years >= 12 then 'principal'::public.seniority_level
    when p_years >= 7  then 'senior'::public.seniority_level
    when p_years >= 4  then 'mid'::public.seniority_level
    else 'associate'::public.seniority_level
  end;
$$;

-- Create a presales profile for one member if they don't have one.
create or replace function public.ensure_presales_profile(p_member_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.presales_profiles (member_id, opted_in, seniority, formats, cities)
  select m.id,
         true,
         public.presales_seniority_from_years(pr.years_experience),
         '{online}',
         coalesce(
           array_remove(array[public.presales_city_from_location(pr.location)], null),
           '{}'
         )
  from public.members m
  left join public.profiles pr on pr.member_id = m.id
  where m.id = p_member_id
    and m.status = 'active'
  on conflict (member_id) do nothing;
$$;

revoke all on function public.ensure_presales_profile(uuid) from public;
grant execute on function public.ensure_presales_profile(uuid) to service_role;

-- Keep it current: joining a specialist pod creates the profile.
create or replace function public.presales_profile_on_pod_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.pods p where p.id = new.pod_id and not p.is_main) then
    perform public.ensure_presales_profile(new.member_id);
  end if;
  return new;
end $$;

drop trigger if exists pod_memberships_presales_profile on public.pod_memberships;
create trigger pod_memberships_presales_profile
  after insert on public.pod_memberships
  for each row execute function public.presales_profile_on_pod_join();

-- Backfill everyone already in a specialist pod.
do $$
declare
  v_before int;
  v_after  int;
begin
  select count(*) into v_before from public.presales_profiles;

  perform public.ensure_presales_profile(x.member_id)
  from (
    select distinct pm.member_id
    from public.pod_memberships pm
    join public.pods p on p.id = pm.pod_id and not p.is_main
    join public.members m on m.id = pm.member_id and m.status = 'active'
  ) x;

  select count(*) into v_after from public.presales_profiles;

  if v_after > v_before then
    insert into public.audit_log (actor_id, action, target_type, reason, metadata)
    values (null, 'tracker.presales_profiles_backfilled', 'member',
            'Phase 3 backfill: engineers opted in by default',
            jsonb_build_object('created', v_after - v_before, 'source', '49_presales_profiles_backfill'));
  end if;
end $$;

-- Check: what was created.
select count(*)                                            as presales_profiles,
       count(*) filter (where opted_in)                    as opted_in,
       count(*) filter (where seniority is not null)       as with_seniority,
       count(*) filter (where cardinality(cities) > 0)     as with_city,
       count(*) filter (where 'Lagos' = any (cities))      as in_lagos
from public.presales_profiles;
