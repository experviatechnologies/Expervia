-- ============================================================================
-- ETEN Phase 1 — 07 · Feed RLS fix  (repairs M2.4 posting)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–06. Idempotent.
--
-- BUG: a non-operations member could never publish a post. Creating a post is
-- two steps — insert the `posts` row, then insert a `post_targets` row pointing
-- it at a pod. The post_targets / post_attachments / post_tags WRITE policies
-- verify authorship with an inline subquery:
--
--     exists (select 1 from public.posts p
--             where p.id = post_id and p.author_id = auth.uid())
--
-- That subquery reads `public.posts`, so it is itself filtered by the posts
-- SELECT policy, `can_see_post()` — which returns FALSE until the post already
-- has a target in a visible pod. At the moment the FIRST target is inserted the
-- post has no target yet, so the subquery sees nothing and the check fails with
-- "new row violates row-level security policy" (SQLSTATE 42501). Only ops passed,
-- via the separate is_operations() branch.
--
-- FIX: check authorship through a SECURITY DEFINER helper that bypasses RLS, so
-- it can see the just-created (still target-less) post. Semantics are unchanged —
-- it still only returns true for the post's own author.
-- ============================================================================

create or replace function public.owns_post(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id and p.author_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- post_targets — author (or ops) sets / removes targets.
-- ----------------------------------------------------------------------------
drop policy if exists post_targets_insert on public.post_targets;
create policy post_targets_insert on public.post_targets for insert to authenticated
  with check (public.is_operations() or public.owns_post(post_id));

drop policy if exists post_targets_delete on public.post_targets;
create policy post_targets_delete on public.post_targets for delete to authenticated
  using (public.is_operations() or public.owns_post(post_id));

-- ----------------------------------------------------------------------------
-- post_attachments — author (or ops) writes.
-- ----------------------------------------------------------------------------
drop policy if exists post_attachments_write on public.post_attachments;
create policy post_attachments_write on public.post_attachments for all to authenticated
  using (public.is_operations() or public.owns_post(post_id))
  with check (public.is_operations() or public.owns_post(post_id));

-- ----------------------------------------------------------------------------
-- post_tags — author (or ops) writes.
-- ----------------------------------------------------------------------------
drop policy if exists post_tags_write on public.post_tags;
create policy post_tags_write on public.post_tags for all to authenticated
  using (public.is_operations() or public.owns_post(post_id))
  with check (public.is_operations() or public.owns_post(post_id));
