-- ============================================================================
-- ETEN - 65 - CRM: merge two contact records into one (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 64. Safe to re-run. Re-run it after 66 (lists), 67 (tasks) and
-- 68 (deals), so a merge also carries those across.
--
-- Used by the CRM review queue. When staff confirm that a lead (e.g. from a
-- Facebook lead ad) is the same person as an existing member, the lead is
-- merged INTO the member's contact, in one transaction:
--   * the lead's timeline entries, list memberships, tasks and deals move to the
--     member's contact
--   * tags and communities are combined
--   * the lead's email and phone are kept as alternates if they differ
--     (phones compared on their last 10 digits)
--   * the earliest "first seen" date wins
--   * a timeline entry records the merge, then the lead row is deleted
--
-- Only the server calls this (service_role, after its own staff check):
-- execute is revoked from everyone else.
-- ============================================================================

create or replace function public.crm_merge_contacts(
  p_source uuid,   -- the duplicate to remove (the lead)
  p_target uuid,   -- the record to keep (usually the member's contact)
  p_actor  uuid    -- staff member doing the merge
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.crm_contacts%rowtype;
  t public.crm_contacts%rowtype;
  v_alt_emails jsonb;
  v_alt_phones jsonb;
  v_summary text;
begin
  if p_source = p_target then
    raise exception 'Cannot merge a contact into itself';
  end if;

  -- Lock both rows (in a fixed order, so two merges can't deadlock).
  perform 1 from public.crm_contacts
    where id in (p_source, p_target)
    order by id
    for update;

  select * into s from public.crm_contacts where id = p_source;
  select * into t from public.crm_contacts where id = p_target;
  if s.id is null or t.id is null then
    raise exception 'Contact not found';
  end if;
  if s.member_id is not null and t.member_id is not null
     and s.member_id <> t.member_id then
    raise exception 'Both contacts are linked to different accounts';
  end if;

  -- Alternate emails/phones: keep the lead's if they differ from the target.
  v_alt_emails := coalesce(t.eten->'alternate_emails', '[]'::jsonb);
  if s.email is not null and s.email is distinct from t.email
     and not v_alt_emails ? s.email then
    v_alt_emails := v_alt_emails || to_jsonb(s.email);
  end if;
  v_alt_phones := coalesce(t.eten->'alternate_phones', '[]'::jsonb);
  -- Phones compare on their last 10 digits: 0801... and +234801... match.
  if s.phone is not null
     and right(regexp_replace(s.phone, '\D', '', 'g'), 10)
         is distinct from right(regexp_replace(coalesce(t.phone, ''), '\D', '', 'g'), 10)
     and not v_alt_phones ? s.phone then
    v_alt_phones := v_alt_phones || to_jsonb(s.phone);
  end if;

  -- Move the timeline first (the source row is deleted below).
  update public.crm_activities set contact_id = p_target
    where contact_id = p_source;

  -- Keep their fixed-list memberships (SQL 66). Checked at run time so this
  -- function also works before lists exist.
  if to_regclass('public.crm_list_members') is not null then
    execute
      'insert into public.crm_list_members (list_id, contact_id, added_by, added_at)
         select list_id, $1, added_by, added_at
           from public.crm_list_members where contact_id = $2
       on conflict (list_id, contact_id) do nothing'
      using p_target, p_source;
  end if;

  -- Their tasks (SQL 67) follow them too.
  if to_regclass('public.crm_tasks') is not null then
    execute 'update public.crm_tasks set contact_id = $1 where contact_id = $2'
      using p_target, p_source;
  end if;

  -- And their deals (SQL 68).
  if to_regclass('public.crm_deals') is not null then
    execute 'update public.crm_deals set contact_id = $1 where contact_id = $2'
      using p_target, p_source;
  end if;

  -- Free the lead's unique keys before the target takes anything over.
  delete from public.crm_contacts where id = p_source;

  update public.crm_contacts set
    member_id     = coalesce(t.member_id, s.member_id),
    tags          = (select coalesce(array_agg(distinct x), '{}')
                       from unnest(t.tags || s.tags) x),
    communities   = (select coalesce(array_agg(distinct x), '{}')
                       from unnest(t.communities || s.communities) x),
    first_seen_at = least(t.first_seen_at, s.first_seen_at),
    company_id    = coalesce(t.company_id, s.company_id),
    job_title     = coalesce(t.job_title, s.job_title),
    city          = coalesce(t.city, s.city),
    state         = coalesce(t.state, s.state),
    country       = coalesce(t.country, s.country),
    gender        = coalesce(t.gender, s.gender),
    source        = coalesce(t.source, s.source),
    email         = coalesce(t.email, s.email),
    phone         = coalesce(t.phone, s.phone),
    eten          = (s.eten - 'suggested_member_id') || t.eten
                    || jsonb_build_object(
                         'alternate_emails', v_alt_emails,
                         'alternate_phones', v_alt_phones),
    review_reason = null
  where id = p_target;

  v_summary := concat_ws(E'\n',
    'Merged a duplicate record into this contact.',
    case when s.email is not null then 'Their other email: ' || s.email end,
    case when s.source is not null then 'Came in from: ' || s.source end);

  insert into public.crm_activities
    (contact_id, type, product, event, subject, body, payload, actor_id)
  values
    (p_target, 'system', 'crm', 'contacts_merged', 'Duplicate merged',
     v_summary,
     jsonb_build_object('merged_contact_id', p_source,
                        'merged_email', s.email,
                        'merged_name', trim(s.first_name || ' ' || s.last_name)),
     p_actor);
end $$;

revoke all on function public.crm_merge_contacts(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.crm_merge_contacts(uuid, uuid, uuid)
  to service_role;
