-- ============================================================================
-- ETEN — 20 · Events (admin-managed)  [Events manager M-E.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–19. Idempotent.
--
-- Moves the public /events listing from a code file to a table ops can manage.
-- The public events board shows PUBLISHED events (live/upcoming/ended computed
-- from start_at/end_at); a recording_url lets ops link a YouTube recording on
-- past events so members who missed it can watch.
--
-- Flyer images live in a PUBLIC storage bucket named `event-media` (create it
-- in the Supabase dashboard — Storage → New bucket → name "event-media",
-- Public = ON). Uploads go through an ops route via service_role; the public
-- URL is rendered directly.
--
-- RLS: anyone (incl. anonymous marketing visitors) may read PUBLISHED events;
-- operations read all and write. Admin writes also go via service_role.
-- ============================================================================

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  blurb         text,
  speaker       text,
  speaker_title text,
  start_at      timestamptz,
  end_at        timestamptz,
  platform      text,
  join_url      text,
  image_path    text,        -- object path in the public `event-media` bucket
  recording_url text,        -- e.g. a YouTube link for a past event
  published     boolean not null default false,
  created_by    uuid references public.members (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists events_published_start_idx
  on public.events (published, start_at);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

-- Public read of published events (anonymous visitors included); ops see all.
drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select to anon, authenticated
  using (published or public.is_operations());

-- Operations write.
drop policy if exists events_write_ops on public.events;
create policy events_write_ops on public.events
  for all to authenticated
  using (public.is_operations())
  with check (public.is_operations());
