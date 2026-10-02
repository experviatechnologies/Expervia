-- ============================================================================
-- ETEN Mentorship - 34 - Central scheduling settings (Availability AV-7)
-- ----------------------------------------------------------------------------
-- Run AFTER 33. Idempotent (safe to re-run).
--
-- Platform-wide default scheduling values that operations can change without an
-- engineering deploy (PRD FR-20). These seed a mentor's availability editor the
-- first time they open it, before they save their own preferences. Extension
-- duration/pricing (FR-20) land with Track B (Paystack).
--
-- Single-row table (id is always true). Read by anyone (authenticated); only
-- operations write, via a gated server action using the service_role key.
-- ============================================================================

create table if not exists public.mentorship_settings (
  id                      boolean primary key default true check (id),
  default_session_minutes int not null default 40  check (default_session_minutes between 10 and 240),
  min_notice_minutes      int not null default 120 check (min_notice_minutes >= 0),
  buffer_minutes          int not null default 10  check (buffer_minutes >= 0),
  updated_at              timestamptz not null default now()
);

-- Ensure the single settings row exists.
insert into public.mentorship_settings (id) values (true)
  on conflict (id) do nothing;

drop trigger if exists mentorship_settings_set_updated_at on public.mentorship_settings;
create trigger mentorship_settings_set_updated_at
  before update on public.mentorship_settings
  for each row execute function public.set_updated_at();

alter table public.mentorship_settings enable row level security;

drop policy if exists mentorship_settings_select on public.mentorship_settings;
create policy mentorship_settings_select on public.mentorship_settings
  for select to authenticated
  using (true);
