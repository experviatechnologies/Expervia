-- ============================================================================
-- ETEN - 69 - CRM: every new member becomes a CRM contact automatically (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 64. Safe to re-run.
--
-- When a members row is created (any sign-up: ETEN, Mentorship, Women in Tech,
-- guest booking, staff provisioning), this keeps the CRM in step:
--   1. already linked to a contact            -> nothing to do
--   2. a CRM lead has the same email, no account -> link that lead to the new
--      account (a lead from an ad who later signs up stays ONE person)
--   3. otherwise                               -> create their contact
-- and writes a "signed up" entry on their timeline.
--
-- It must never block a sign-up: any error is turned into a warning in the
-- database log and the sign-up carries on.
--
-- The backfill at the end does the same for members created before this ran.
-- ============================================================================

create or replace function public.crm_sync_member(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m          public.members%rowtype;
  u          auth.users%rowtype;
  v_email    text;
  v_name     text;
  v_first    text;
  v_last     text;
  v_source   text;
  v_comms    text[] := '{}';
  v_contact  uuid;
begin
  select * into m from public.members where id = p_member_id;
  if m.id is null then return null; end if;

  select id into v_contact from public.crm_contacts where member_id = m.id;
  if v_contact is not null then return v_contact; end if;

  select * into u from auth.users where id = m.id;
  v_email := nullif(lower(trim(u.email)), '');
  v_name  := coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
                      split_part(coalesce(v_email, ''), '@', 1));
  v_first := split_part(v_name, ' ', 1);
  v_last  := nullif(trim(substr(v_name, length(v_first) + 1)), '');
  v_source := case
    when m.origin = 'migrated' then 'Migrated member'
    when m.signup_source::text = 'mentorship' then 'Mentorship signup'
    else 'Platform signup'
  end;
  if nullif(u.raw_user_meta_data->>'community_interest', '') is not null then
    v_comms := array[u.raw_user_meta_data->>'community_interest'];
  end if;

  -- 2. A lead with this email and no account yet: link it.
  if v_email is not null then
    update public.crm_contacts
       set member_id   = m.id,
           communities = (select coalesce(array_agg(distinct x), '{}')
                            from unnest(communities || v_comms) x)
     where email = v_email and member_id is null
     returning id into v_contact;
  end if;

  -- 3. Nobody to link: create the contact.
  if v_contact is null then
    insert into public.crm_contacts
      (member_id, first_name, last_name, email, audience, lifecycle,
       lead_status, source, communities, import_key, first_seen_at)
    values
      (m.id, coalesce(v_first, ''), coalesce(v_last, ''), v_email, 'eten',
       'subscriber', 'new', v_source, v_comms, 'member:' || m.id, m.created_at)
    on conflict do nothing
    returning id into v_contact;
  end if;

  if v_contact is not null then
    insert into public.crm_activities
      (contact_id, type, product, event, subject, occurred_at, dedupe_key)
    values
      (v_contact, 'system',
       case when m.signup_source::text = 'mentorship' then 'mentorship'
            else 'expervia' end::public.crm_product,
       case when m.origin = 'migrated' then 'account_migrated'
            else 'account_registered' end,
       case when m.origin = 'migrated' then 'Account created by staff'
            else 'Signed up on the platform' end,
       m.created_at,
       'signup:' || m.id)
    on conflict (dedupe_key) do nothing;
  end if;

  return v_contact;
end $$;

revoke all on function public.crm_sync_member(uuid) from public, anon, authenticated;
grant execute on function public.crm_sync_member(uuid) to service_role;

-- Trigger wrapper: never lets a CRM problem stop someone signing up.
create or replace function public.crm_on_member_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.crm_sync_member(new.id);
  exception when others then
    raise warning 'crm_sync_member failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists crm_on_member_created on public.members;
create trigger crm_on_member_created
  after insert on public.members
  for each row execute function public.crm_on_member_created();

-- Backfill: anyone who became a member before this trigger existed.
select public.crm_sync_member(m.id)
  from public.members m
 where not exists (select 1 from public.crm_contacts c where c.member_id = m.id);
