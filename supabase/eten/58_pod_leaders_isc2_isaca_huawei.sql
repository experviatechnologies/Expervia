-- ============================================================================
-- ETEN Presales Tracker - 58 - ISC2/ISACA Pod Leader and a Huawei pod
-- (6 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 57. Idempotent (safe to re-run): every change checks current
-- state first, and audit/notification rows are only written once.
--
-- From the business, 6 Nov 2026:
--   1. Ikenna Enyidede -> Pod Leader of ISC2 Cybersecurity Specialists (he is
--      already a member) and ISACA Cybersecurity (he joins it).
--   2. New pod "Huawei" with a starter skill set. No Pod Leader yet: set one
--      in Admin > Pods > Huawei when confirmed.
--   Developer Tools is left as it is until its leader is confirmed.
--
-- Ikenna is targeted by account id (checked active and activated), never by
-- name. Any existing Lead of those pods would go back to member (one Pod
-- Leader per pod); there is none today. Each change is written to audit_log
-- as tracker.* and he gets an in-app presales notification.
-- ============================================================================

do $$
declare
  v_ikenna constant uuid := 'f2eff93d-9ba6-48da-bf6f-df03fa6c9847';
  v_reason constant text := 'Pod leader list from the business, 6 Nov 2026';
  v_ops    uuid;
  v_pod    uuid;
  v_slug   text;
begin
  -- Safety: the target must be an active, activated account.
  if not exists (
    select 1 from public.members
    where id = v_ikenna and status = 'active' and claimed_at is not null
  ) then
    raise exception 'Ikenna Enyidede''s account (%) is missing, inactive or not activated; nothing was changed', v_ikenna;
  end if;

  -- Actor for the audit log and notifications: an operations account.
  select id into v_ops from public.members
  where role = 'operations' and status = 'active'
  order by created_at
  limit 1;

  -- 2. Huawei pod + starter skills (pod-prefixed slugs, like 29 and 48).
  insert into public.pods (slug, name, description, is_main) values
    ('huawei', 'Huawei',
     'Huawei ICT and cloud: Huawei Cloud, datacom networking, storage, security and AI, aligned to the HCIA, HCIP and HCIE certifications.',
     false)
  on conflict (slug) do nothing;

  insert into public.skills (slug, name, pod_id, sort)
  select v.slug, v.name, p.id, v.sort
  from (values
    ('huawei-cloud',    'Huawei Cloud',                      1),
    ('huawei-datacom',  'Datacom (Routing & Switching)',     2),
    ('huawei-security', 'Huawei Network Security',           3),
    ('huawei-storage',  'Huawei Storage',                    4),
    ('huawei-ai',       'Huawei AI (ModelArts & Ascend)',    5),
    ('huawei-wlan',     'WLAN & Wireless',                   6)
  ) as v(slug, name, sort)
  join public.pods p on p.slug = 'huawei'
  on conflict (slug) do nothing;

  -- 1. Ikenna leads ISC2 and ISACA.
  foreach v_slug in array array['isc2-cybersecurity', 'isaca-cybersecurity'] loop
    select id into v_pod from public.pods where slug = v_slug;
    if v_pod is null then
      raise exception 'Pod % not found; nothing was changed', v_slug;
    end if;

    -- Already the leader: nothing to do for this pod.
    continue when exists (
      select 1 from public.pod_memberships
      where pod_id = v_pod and member_id = v_ikenna and role_in_pod = 'lead'
    );

    -- One Pod Leader per pod: a previous Lead goes back to member.
    update public.pod_memberships
       set role_in_pod = 'member'
     where pod_id = v_pod and role_in_pod = 'lead';

    -- Join the pod if needed, and take the Lead role.
    insert into public.pod_memberships (pod_id, member_id, role_in_pod)
    values (v_pod, v_ikenna, 'lead')
    on conflict (pod_id, member_id) do update set role_in_pod = 'lead';

    insert into public.audit_log (actor_id, action, target_type, target_id, reason, metadata)
    values (v_ops, 'tracker.pod_leader_set', 'pod', v_pod, v_reason,
            jsonb_build_object('slot', 'lead', 'member_id', v_ikenna, 'source', '58_pod_leaders_isc2_isaca_huawei'));

    insert into public.notifications (recipient_id, type, actor_id, target_type)
    values (v_ikenna, 'presales', v_ops, 'pod_leader_assigned');
  end loop;
end $$;

-- Check: Lead per specialist pod after the run (Not set = still needed).
select p.name as pod,
       coalesce(pr.full_name, 'Not set') as pod_leader
from public.pods p
left join public.pod_memberships pm on pm.pod_id = p.id and pm.role_in_pod = 'lead'
left join public.profiles pr on pr.member_id = pm.member_id
where not p.is_main
order by (pr.full_name is null), p.name;
