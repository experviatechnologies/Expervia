-- ============================================================================
-- ETEN Phase 1 — 11 · Profile visibility fix  (fixes "A member" for real)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–10. Idempotent.
--
-- PROBLEM: profiles_select (03_rls.sql) gated visibility of another member's
-- profile with an INLINE subquery on public.members:
--
--     and exists (select 1 from public.members m
--                 where m.id = profiles.member_id
--                   and m.claimed_at is not null and m.status = 'active')
--
-- That subquery runs as the viewing member, so members RLS (members_select:
-- "id = auth.uid() or is_operations()") applies to it — a non-ops member can
-- only see their OWN members row inside it. For every OTHER member the subquery
-- returns no row, the policy denies the profile, and the app shows the generic
-- "A member" fallback. Operations were unaffected because is_operations()
-- short-circuits the OR. The claimed_at backfill (10) couldn't help: the
-- claimed_at test never received a row to evaluate.
--
-- FIX: move the members lookup into a SECURITY DEFINER function (which bypasses
-- RLS on members) — the same pattern every other cross-table check in this
-- schema already uses (is_active_member, is_pod_member, can_see_pod, …). The
-- visibility rule is unchanged: a claimed, active member is visible to any
-- active member.
-- ============================================================================

-- Is this member claimed + active (and therefore visible to other members)?
-- SECURITY DEFINER so the members read is not filtered by members_select.
create or replace function public.member_is_visible(p_member_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = p_member_id
      and m.claimed_at is not null
      and m.status = 'active'
  );
$$;

revoke all on function public.member_is_visible(uuid) from public, anon;
grant execute on function public.member_is_visible(uuid) to authenticated, service_role;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    member_id = auth.uid()
    or public.is_operations()
    or (
      public.is_active_member()
      and public.member_is_visible(profiles.member_id)
    )
  );
