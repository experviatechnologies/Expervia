-- ============================================================================
-- ETEN Mentorship - 37 - Paid session extensions (Monetization M-4)
-- ----------------------------------------------------------------------------
-- Run AFTER 36. Idempotent (safe to re-run).
--
-- A mentee can pay to extend a live 1:1 session by a fixed amount of time (V1:
-- +30 minutes, at most one extension per session). The extension is only made
-- active after the backend verifies the Paystack payment; activation adds the
-- minutes to the circle_sessions row so the server-provided countdown and the
-- LiveKit token TTL both reflect the longer session.
--
-- Because we run without a per-minute cron (Vercel Hobby), paid 1:1 sessions are
-- mentor-ended: the room is not force-closed at the scheduled end, so the extra
-- paid time is actually usable and the mentor closes the room when done.
--
-- Reads: the mentee, the mentor, and operations. Writes go through gated server
-- code using the service_role key, so there is no client write policy.
-- ============================================================================

do $$ begin
  create type public.extension_status as enum ('pending','active','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.session_extensions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.circle_sessions (id) on delete cascade,
  mentor_id    uuid not null references public.members (id) on delete restrict,
  mentee_id    uuid not null references public.members (id) on delete restrict,
  minutes      int not null default 30 check (minutes between 5 and 120),
  amount       integer not null check (amount >= 0),   -- minor units
  currency     char(3) not null check (currency in ('NGN','USD','GHS','KES','ZAR')),
  status       public.extension_status not null default 'pending',
  payment_id   uuid references public.payments (id) on delete set null,
  created_at   timestamptz not null default now(),
  activated_at timestamptz
);

create index if not exists session_extensions_session_idx
  on public.session_extensions (session_id);

-- V1 rule: at most one ACTIVE extension per session.
create unique index if not exists session_extensions_one_active
  on public.session_extensions (session_id)
  where status = 'active';

alter table public.session_extensions enable row level security;

drop policy if exists session_extensions_select on public.session_extensions;
create policy session_extensions_select on public.session_extensions
  for select to authenticated
  using (
    mentee_id = auth.uid()
    or mentor_id = auth.uid()
    or public.is_operations()
  );
