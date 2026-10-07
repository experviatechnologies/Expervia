-- ============================================================================
-- ETEN Mentorship - 38 - Mentor earnings ledger (Monetization M-5)
-- ----------------------------------------------------------------------------
-- Run AFTER 37. Idempotent (safe to re-run).
--
-- A standalone, auditable ledger of what each mentor has earned (PRD §15-17).
-- Earnings are NOT recomputed from payments on the fly: one row is written per
-- successful payment (unique on payment_id), snapshotting the amounts and the
-- time the money clears the settlement hold.
--
-- Settlement without a cron: each earning stores `available_at` = the session's
-- scheduled end + the platform settlement hold (default 24h). "Available"
-- balance is then derived on read as status='pending' AND available_at <= now;
-- "pending" balance is the rest. A payout run (M-6) marks earnings 'paid'; a
-- refund (M-7) marks them 'reversed'. No background job flips states.
--
-- V1 money policy: ETEN absorbs the Paystack processing fee out of its own
-- commission, so the mentor's net_amount equals their post-commission share.
-- platform_fee / payment_fee / tax are recorded for reconciliation.
--
-- Reads: the owning mentor + operations. Writes go through server code using the
-- service_role key, so there is no client write policy.
-- ============================================================================

do $$ begin
  create type public.earning_status as enum ('pending','paid','reversed');
exception when duplicate_object then null; end $$;

create table if not exists public.mentor_earnings (
  id           uuid primary key default gen_random_uuid(),
  mentor_id    uuid not null references public.members (id) on delete restrict,
  payment_id   uuid not null unique references public.payments (id) on delete cascade,
  session_id   uuid references public.circle_sessions (id) on delete set null,
  extension_id uuid,
  -- All amounts in minor units.
  gross_amount integer not null check (gross_amount >= 0),  -- mentor share after commission
  platform_fee integer not null default 0 check (platform_fee >= 0),
  payment_fee  integer not null default 0 check (payment_fee >= 0),
  tax          integer not null default 0 check (tax >= 0),
  net_amount   integer not null check (net_amount >= 0),    -- payable to the mentor
  currency     char(3) not null check (currency in ('NGN','USD','GHS','KES','ZAR')),
  status       public.earning_status not null default 'pending',
  available_at timestamptz not null,       -- when it clears the settlement hold
  paid_at      timestamptz,
  payout_id    uuid,                        -- set by the payout run (M-6)
  created_at   timestamptz not null default now()
);

create index if not exists mentor_earnings_mentor_idx
  on public.mentor_earnings (mentor_id, status);
create index if not exists mentor_earnings_available_idx
  on public.mentor_earnings (status, available_at);
create index if not exists mentor_earnings_payout_idx
  on public.mentor_earnings (payout_id);

alter table public.mentor_earnings enable row level security;

drop policy if exists mentor_earnings_select on public.mentor_earnings;
create policy mentor_earnings_select on public.mentor_earnings
  for select to authenticated
  using (mentor_id = auth.uid() or public.is_operations());
