-- ============================================================================
-- ETEN Mentorship platform — 22 · RLS lock-down for the Prospect tier (MP-2.4)
-- ----------------------------------------------------------------------------
-- Run AFTER 21. Idempotent (safe to re-run).
--
-- Now that self-registered Prospects (members with validated_at IS NULL) can
-- exist, they must NOT reach the ETEN member community (directory, pods, feed,
-- DMs). The whole community is gated by public.is_active_member(); a Prospect
-- is "active + claimed" but not validated, so this tightens that one helper to
-- also require validation. Ops (is_operations) and self (member_id = auth.uid)
-- paths are untouched: a Prospect keeps their own account, profile and data.
--
-- Three changes:
--   1. is_active_member() also requires validated_at IS NOT NULL.
--   2. pod_memberships_join_self (the one community write not routed through
--      that helper) gets the same gate, so a Prospect cannot self-join a pod.
--   3. A trigger stamps members.validated_at when a member completes ETEN
--      onboarding (primary_specialization_pod_id set). This keeps every real
--      member Validated (so the tighter gate never strands them) and is the
--      Prospect -> Validated conversion at the DB layer.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Community gate now requires validation.
-- ----------------------------------------------------------------------------
create or replace function public.is_active_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = auth.uid()
      and m.status = 'active'
      and m.claimed_at is not null
      and m.validated_at is not null
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Close the one community write that bypassed the helper: joining a pod.
-- ----------------------------------------------------------------------------
drop policy if exists pod_memberships_join_self on public.pod_memberships;
create policy pod_memberships_join_self on public.pod_memberships
  for insert to authenticated
  with check (
    (
      member_id = auth.uid()
      and role_in_pod = 'member'         -- self-join, never self-appoint
      and public.is_active_member()      -- ...and only Validated members
    )
    or public.is_operations()
  );

-- ----------------------------------------------------------------------------
-- 3. Completing ETEN onboarding (primary pod set) => Validated.
--    OLD is only read under TG_OP = 'UPDATE'; the update is idempotent
--    (only stamps when validated_at is still null).
-- ----------------------------------------------------------------------------
create or replace function public.stamp_validated_on_onboarding()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.primary_specialization_pod_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.primary_specialization_pod_id
       is not distinct from old.primary_specialization_pod_id then
      return new; -- the pod field did not change
    end if;
  end if;
  update public.members
    set validated_at = now()
    where id = new.member_id
      and validated_at is null;
  return new;
end $$;

drop trigger if exists profiles_stamp_validated on public.profiles;
create trigger profiles_stamp_validated
  after insert or update of primary_specialization_pod_id on public.profiles
  for each row execute function public.stamp_validated_on_onboarding();
