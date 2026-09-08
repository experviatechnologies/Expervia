-- ============================================================================
-- ETEN Phase 1 — 08 · Polls  (M2 feed polls)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–07. Idempotent.
--
-- A poll is just a post (its body is the question) plus 2+ options. Each active
-- member casts at most one vote per poll — enforced by unique (post_id,
-- member_id) — and may change or retract it. Visibility rides can_see_post(),
-- and authorship of the options rides owns_post() (added in 07).
-- ============================================================================

create table if not exists public.poll_options (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  label      text not null,
  sort       int,
  created_at timestamptz not null default now()
);
create index if not exists poll_options_post_idx on public.poll_options (post_id);

create table if not exists public.poll_votes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  option_id  uuid not null references public.poll_options (id) on delete cascade,
  member_id  uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, member_id)         -- one vote per member per poll
);
create index if not exists poll_votes_post_idx on public.poll_votes (post_id);
create index if not exists poll_votes_option_idx on public.poll_votes (option_id);

alter table public.poll_options enable row level security;
alter table public.poll_votes   enable row level security;

-- poll_options — readable when the post is; written by the post's author / ops.
drop policy if exists poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options for select to authenticated
  using (public.can_see_post(post_id));

drop policy if exists poll_options_write on public.poll_options;
create policy poll_options_write on public.poll_options for all to authenticated
  using (public.is_operations() or public.owns_post(post_id))
  with check (public.is_operations() or public.owns_post(post_id));

-- poll_votes — tallies visible to anyone who can see the post; each member casts
-- / changes / retracts their own vote.
drop policy if exists poll_votes_select on public.poll_votes;
create policy poll_votes_select on public.poll_votes for select to authenticated
  using (public.can_see_post(post_id));

drop policy if exists poll_votes_insert_self on public.poll_votes;
create policy poll_votes_insert_self on public.poll_votes for insert to authenticated
  with check (
    member_id = auth.uid()
    and public.is_active_member()
    and public.can_see_post(post_id)
  );

drop policy if exists poll_votes_update_self on public.poll_votes;
create policy poll_votes_update_self on public.poll_votes for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

drop policy if exists poll_votes_delete_self on public.poll_votes;
create policy poll_votes_delete_self on public.poll_votes for delete to authenticated
  using (member_id = auth.uid());
