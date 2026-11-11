-- ============================================================================
-- ETEN - 62 - Push notifications (PWA phase 4, 11 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 61. Safe to re-run.
--
-- Members can turn on notifications on their phone or computer. Each device
-- that says yes is one row in push_subscriptions (the browser's push address
-- and keys). Every in-app notification is then also sent to those devices,
-- unless the member switched that kind off in push_preferences.
--
--   push_subscriptions  one row per device. Removed when the member turns it
--                       off, or when the browser reports it gone (404/410).
--   push_preferences    the kinds of notification a member does NOT want on
--                       their devices (category names as in notification_type,
--                       plus 'session_reminder'). No row = the defaults: only
--                       reactions and pod activity are off.
--   circle_sessions.reminder_sent_at
--                       set when "your session starts soon" went out, so the
--                       15-minute job never reminds twice.
--
-- Written only by the server (service_role), so RLS is on with no policies.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  platform      text not null default 'other'
                check (platform in ('android', 'ios', 'desktop', 'other')),
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_sent_at  timestamptz
);

create index if not exists push_subscriptions_member_idx
  on public.push_subscriptions (member_id);

alter table public.push_subscriptions enable row level security;

create table if not exists public.push_preferences (
  member_id   uuid primary key references public.members (id) on delete cascade,
  muted       text[] not null default '{reaction,pod_activity}',
  updated_at  timestamptz not null default now()
);

alter table public.push_preferences enable row level security;

alter table public.circle_sessions
  add column if not exists reminder_sent_at timestamptz;
