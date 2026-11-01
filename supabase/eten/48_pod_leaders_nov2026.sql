-- ============================================================================
-- ETEN Presales Tracker - 48 - Pod leadership from the business list
-- (Phase 3, step 3.2b, 1 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 47. Idempotent (safe to re-run): every change checks current state
-- first, and audit/notification rows are only written once.
--
-- Source: the Pod Leader list supplied by the business on 1 Nov 2026.
-- Members are targeted by account id (resolved from the names and checked to
-- be active and activated), never by name, so similarly named or duplicate
-- accounts are not affected.
--
--   Already Pod Leaders (no change): Prince Richard Osaro (Data & AI),
--   Christian Chukwu (Azure Infrastructure), Uchechukwu Augustine Azunna
--   (Modern Work).
--
--   1. Precious Airuoyefe   -> Pod Leader, Business Applications.
--   2. Temiloluwa Komolafe  -> joins Security (keeps Azure Infrastructure)
--                              and becomes its Pod Leader.
--   3. New pod "Anthropic (Claude AI)" with a starter skill set;
--      Jinadu Kolapo Jelili joins it as Pod Leader.
--   4. Gabriel Mekuleyi (Head of ETEN Academy) and Tobore Akpomerha (Head of
--      ETEN Leaders, the ACTIVATED account) -> Management role in the tracker.
--
-- Any existing Lead of an affected pod is moved back to member (one Pod Leader
-- per pod). Each change is written to audit_log as tracker.* and the person
-- gets an in-app presales notification, with the operations account as actor.
-- ============================================================================

do $$
declare
  v_ops        constant uuid := '27e0afb3-531d-4594-94ff-b6c6451c9865';
  v_precious   constant uuid := 'bbadd5f8-d21d-4267-8fdf-3d3eab8faa89';
  v_temiloluwa constant uuid := '4f08dc0a-bcdf-4fcd-8a96-4374dfae151f';
  v_jinadu     constant uuid := '42805b09-55ae-4a09-9254-8c75813e511c';
  v_gabriel    constant uuid := 'd81fedfa-d19a-4eb3-adda-525ac26ee2a2';
  v_tobore     constant uuid := '7e5d7046-4185-4b83-a8fb-9c90c425560b';
  v_reason     constant text := 'Pod leader list from the business, 1 Nov 2026';
  v_pod        uuid;
  v_member     uuid;
  v_slug       text;
begin
  -- Safety: every target must be an active, activated account.
  foreach v_member in array array[v_precious, v_temiloluwa, v_jinadu, v_gabriel, v_tobore] loop
    if not exists (
      select 1 from public.members
      where id = v_member and status = 'active' and claimed_at is not null
    ) then
      raise exception 'Member % is missing, inactive or not activated; nothing was changed', v_member;
    end if;
  end loop;

  -- 3a. Anthropic pod + starter skills (pod-prefixed slugs, like 29).
  insert into public.pods (slug, name, description, is_main) values
    ('anthropic', 'Anthropic (Claude AI)',
     'Building with Anthropic''s Claude: the Claude API, agents, Claude Code, MCP integrations and responsible AI adoption.',
     false)
  on conflict (slug) do nothing;

  insert into public.skills (slug, name, pod_id, sort)
  select v.slug, v.name, p.id, v.sort
  from (values
    ('anthropic-claude-api',      'Claude API & SDKs',             1),
    ('anthropic-agents',          'AI Agents & Tool Use',          2),
    ('anthropic-claude-code',     'Claude Code',                   3),
    ('anthropic-mcp',             'Model Context Protocol (MCP)',  4),
    ('anthropic-prompting',       'Prompt & Context Engineering',  5),
    ('anthropic-ai-governance',   'Responsible AI & Governance',   6)
  ) as v(slug, name, sort)
  join public.pods p on p.slug = 'anthropic'
  on conflict (slug) do nothing;

  -- 1-3b. Pod Leaders: (member, pod slug).
  for v_member, v_slug in
    select * from (values
      (v_precious,   'biz-apps'),
      (v_temiloluwa, 'security'),
      (v_jinadu,     'anthropic')
    ) as t(member_id, slug)
  loop
    select id into v_pod from public.pods where slug = v_slug;
    if v_pod is null then
      raise exception 'Pod % not found; nothing was changed', v_slug;
    end if;

    -- Already the leader: nothing to do for this pod.
    continue when exists (
      select 1 from public.pod_memberships
      where pod_id = v_pod and member_id = v_member and role_in_pod = 'lead'
    );

    -- One Pod Leader per pod: the previous Lead goes back to member.
    update public.pod_memberships
       set role_in_pod = 'member'
     where pod_id = v_pod and role_in_pod = 'lead';

    -- Join the pod if needed, and take the Lead role.
    insert into public.pod_memberships (pod_id, member_id, role_in_pod)
    values (v_pod, v_member, 'lead')
    on conflict (pod_id, member_id) do update set role_in_pod = 'lead';

    insert into public.audit_log (actor_id, action, target_type, target_id, reason, metadata)
    values (v_ops, 'tracker.pod_leader_set', 'pod', v_pod, v_reason,
            jsonb_build_object('slot', 'lead', 'member_id', v_member, 'source', '48_pod_leaders_nov2026'));

    insert into public.notifications (recipient_id, type, actor_id, target_type)
    values (v_member, 'presales', v_ops, 'pod_leader_assigned');
  end loop;

  -- 4. Management role for the two heads.
  foreach v_member in array array[v_gabriel, v_tobore] loop
    continue when exists (
      select 1 from public.member_roles where member_id = v_member and role = 'management'
    );
    insert into public.member_roles (member_id, role, granted_by)
    values (v_member, 'management', v_ops);

    insert into public.audit_log (actor_id, action, target_type, target_id, reason, metadata)
    values (v_ops, 'tracker.role_granted', 'member', v_member, v_reason,
            jsonb_build_object('role', 'management', 'source', '48_pod_leaders_nov2026'));

    insert into public.notifications (recipient_id, type, actor_id, target_type)
    values (v_member, 'presales', v_ops, 'role_granted');
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
