-- ETEN event registrations.
-- Run this once in the Supabase SQL Editor (same project as community_applications).
-- Kept in its own table so event sign-ups are instantly distinguishable from
-- community applications and from contact-form inquiries (which are email-only).

create table if not exists public.event_registrations (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  first_name         text not null,
  last_name          text not null,
  email              text not null,
  phone              text,
  country            text,
  city               text,
  job_title          text,
  organization       text,
  area_of_expertise  text,
  membership_status  text,
  heard_from         text,
  learning_goals     text,
  consent            boolean not null default false
);

-- The app writes with the service_role key (bypasses RLS). We still enable RLS
-- and add NO public policies, so the anon/public key can neither read nor write
-- these rows — registrations stay private to the server and the dashboard.
alter table public.event_registrations enable row level security;

-- Handy for the admin: newest registrations first.
create index if not exists event_registrations_created_at_idx
  on public.event_registrations (created_at desc);
