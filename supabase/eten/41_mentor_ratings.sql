-- ============================================================================
-- ETEN Mentorship - 41 - Mentee ratings of mentors
-- ----------------------------------------------------------------------------
-- Run AFTER 40. Idempotent (safe to re-run).
--
-- A mentee who has actually been mentored (an accepted 1:1 booking, or a Circle
-- membership under that mentor) can leave a 1-5 star rating plus an optional
-- review. One rating per mentee+mentor (updatable). Ratings are read across the
-- app (mentor directory + profile) so select is open to authenticated users;
-- writes go through a gated server action via the service_role key, so there is
-- no client write policy.
-- ============================================================================

create table if not exists public.mentor_ratings (
  id         uuid primary key default gen_random_uuid(),
  mentor_id  uuid not null references public.members (id) on delete cascade,
  mentee_id  uuid not null references public.members (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  review     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentor_ratings_not_self check (mentee_id <> mentor_id),
  constraint mentor_ratings_review_len
    check (review is null or char_length(review) <= 1000)
);

create unique index if not exists mentor_ratings_one_per_pair
  on public.mentor_ratings (mentor_id, mentee_id);
create index if not exists mentor_ratings_mentor_idx
  on public.mentor_ratings (mentor_id);

drop trigger if exists mentor_ratings_set_updated_at on public.mentor_ratings;
create trigger mentor_ratings_set_updated_at
  before update on public.mentor_ratings
  for each row execute function public.set_updated_at();

alter table public.mentor_ratings enable row level security;

drop policy if exists mentor_ratings_select on public.mentor_ratings;
create policy mentor_ratings_select on public.mentor_ratings
  for select to authenticated
  using (true);
