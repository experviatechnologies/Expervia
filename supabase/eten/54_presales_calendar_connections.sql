-- ============================================================================
-- ETEN Presales Tracker - 54 - Calendar connections (Phase 8, step 8.1)
-- (5 Nov 2026; PRD section 9, FR "Calendar connection")
-- ----------------------------------------------------------------------------
-- Run AFTER 53. Safe to re-run.
--
-- One connected calendar per member (Microsoft first; Google in step 8.4).
-- OAuth tokens are encrypted by the app (AES-256-GCM, key CALENDAR_TOKEN_KEY
-- in Vercel) before they are stored here, so a database export alone cannot
-- be used to read anyone's calendar. Only free/busy and the ETEN meeting
-- events the tracker creates are ever used.
--
-- RLS is on with no policies: only the server (service_role) reads or writes
-- this table. Members see their own status through the tracker's server code.
-- ============================================================================

create table if not exists public.presales_calendar_connections (
  member_id         uuid primary key references public.members (id) on delete cascade,
  provider          text not null check (provider in ('microsoft', 'google')),
  -- connected: working · expired/revoked: needs reconnecting · error: last
  -- call failed for another reason (see last_error).
  status            text not null default 'connected'
                      check (status in ('connected', 'expired', 'revoked', 'error')),
  account_email     text,
  access_token_enc  text not null,
  refresh_token_enc text,
  token_expires_at  timestamptz,
  scopes            text[] not null default '{}',
  last_error        text,
  last_checked_at   timestamptz,
  connected_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists presales_calendar_connections_status_idx
  on public.presales_calendar_connections (status);

drop trigger if exists presales_calendar_connections_set_updated_at
  on public.presales_calendar_connections;
create trigger presales_calendar_connections_set_updated_at
  before update on public.presales_calendar_connections
  for each row execute function public.set_updated_at();

alter table public.presales_calendar_connections enable row level security;
revoke all on public.presales_calendar_connections from anon, authenticated;

-- Offer Microsoft Outlook in the tracker. The Connect button still only works
-- once MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET and CALENDAR_TOKEN_KEY are
-- set in Vercel.
update public.presales_settings set outlook_enabled = true where id;
