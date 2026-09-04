-- ============================================================================
-- ETEN Phase 1 — 02 · RLS helper functions
-- ----------------------------------------------------------------------------
-- Run AFTER 01_schema.sql, BEFORE 03_rls.sql.
--
-- These encapsulate the recurring access questions ("is the caller ops?", "can
-- the caller see this pod / post?", "are they in this conversation?"). Policies
-- in 03_rls.sql call them, which keeps the policies short and puts each rule in
-- exactly one place.
--
-- WHY security definer: a policy on `members` that needs the caller's role must
-- read `members` — doing that inline would re-trigger the same policy and
-- recurse. Defined with `security definer` + a pinned `search_path`, these
-- functions run with the definer's rights and bypass RLS on the tables they
-- read, so there is no recursion and no accidental table capture. They are all
-- read-only (`stable`) and grant EXECUTE to authenticated only.
--
-- auth.uid() = the JWT subject = the caller's members.id (members share the
-- auth.users UUID). It is null for the anon key, so every check fails closed.
-- ============================================================================

-- Is the caller an operations (staff) user?
create or replace function public.is_operations()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = auth.uid() and m.role = 'operations'
  );
$$;

-- Is the caller an active, claimed member? (migrated-but-unclaimed accounts
-- have no password and can never be the caller, but this is defence in depth.)
create or replace function public.is_active_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = auth.uid()
      and m.status = 'active'
      and m.claimed_at is not null
  );
$$;

-- Is the caller a member of this pod?
create or replace function public.is_pod_member(p_pod_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.pod_memberships pm
    where pm.pod_id = p_pod_id and pm.member_id = auth.uid()
  );
$$;

-- Is the caller a lead or co-lead of this pod?
create or replace function public.is_pod_lead(p_pod_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.pod_memberships pm
    where pm.pod_id = p_pod_id
      and pm.member_id = auth.uid()
      and pm.role_in_pod in ('lead','co_lead')
  );
$$;

-- Can the caller see this pod's content?
-- Phase 1: pods are open — any active member may browse any pod (so people can
-- discover a pod before joining). This is the single place to tighten later if
-- private pods are introduced; change only this function.
create or replace function public.can_see_pod(p_pod_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_active_member() or public.is_operations();
$$;

-- Is the caller a lead/co-lead of ANY pod this post targets? (moderation reach)
create or replace function public.leads_any_target_pod(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.post_targets t
    join public.pod_memberships pm on pm.pod_id = t.pod_id
    where t.post_id = p_post_id
      and pm.member_id = auth.uid()
      and pm.role_in_pod in ('lead','co_lead')
  );
$$;

-- Can the caller see this post? Visible when it targets a pod they can see AND
-- it is not removed — unless they are the author, ops, or a lead of a target
-- pod (moderators keep sight of removed content).
create or replace function public.can_see_post(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and exists (
        select 1 from public.post_targets t
        where t.post_id = p.id and public.can_see_pod(t.pod_id)
      )
      and (
        p.is_removed = false
        or p.author_id = auth.uid()
        or public.is_operations()
        or public.leads_any_target_pod(p.id)
      )
  );
$$;

-- Is the caller a participant of this conversation?
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.member_id = auth.uid()
  );
$$;

-- Does a block exist between the caller and any OTHER participant of this
-- conversation (either direction)? Used to stop a blocked pair messaging.
create or replace function public.conversation_has_block(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    join public.blocks b
      on (b.blocker_id = auth.uid()   and b.blocked_id = cp.member_id)
      or (b.blocker_id = cp.member_id and b.blocked_id = auth.uid())
    where cp.conversation_id = p_conversation_id
      and cp.member_id <> auth.uid()
  );
$$;

-- Lock down EXECUTE: only signed-in users (and the service role) may call these.
do $$
declare fn text;
begin
  foreach fn in array array[
    'is_operations()','is_active_member()','is_pod_member(uuid)','is_pod_lead(uuid)',
    'can_see_pod(uuid)','leads_any_target_pod(uuid)','can_see_post(uuid)',
    'is_conversation_participant(uuid)','conversation_has_block(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated, service_role;', fn);
  end loop;
end $$;
