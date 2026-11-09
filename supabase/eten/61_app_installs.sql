-- ============================================================================
-- ETEN - 61 - Installed app usage (PWA phase 3, 10 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 60. Safe to re-run.
--
-- One row per member per kind of device on which they installed or opened the
-- ETEN app from their home screen. Feeds the "Installed app" card on the admin
-- overview: how many members have the app, on which platforms, and how many
-- opened it recently.
--
--   platform        android | ios | desktop | other
--   installed_at    when the browser reported the install, or the first time
--                   we saw them open the installed app (iPhones never report
--                   installs, so for them this is the first open)
--   last_opened_at  last time they opened the installed app (recorded at most
--                   once a day per device)
--
-- Written only by the server (service_role), so RLS is on with no policies.
-- ============================================================================

create table if not exists public.app_installs (
  member_id       uuid not null references public.members (id) on delete cascade,
  platform        text not null check (platform in ('android', 'ios', 'desktop', 'other')),
  installed_at    timestamptz not null default now(),
  last_opened_at  timestamptz,
  primary key (member_id, platform)
);

create index if not exists app_installs_last_opened_idx
  on public.app_installs (last_opened_at desc);

alter table public.app_installs enable row level security;
