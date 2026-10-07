-- ============================================================================
-- ETEN Mentorship - 40 - Refunds + cancellation policy (Monetization M-7)
-- ----------------------------------------------------------------------------
-- Run AFTER 39. Idempotent (safe to re-run).
--
-- A configurable, time-based cancellation/refund policy plus a refunds ledger.
-- When a paid booking is cancelled (or operations refund a payment), the system
-- computes the refund by how long before the session it is, refunds via
-- Paystack, marks the payment refunded/partially_refunded, and reverses the
-- mentor earning if it hasn't been paid out yet.
--
-- Policy (platform-wide, on mentorship_settings), PRD defaults:
--   >= refund_full_hours     before start -> 100%
--   >= refund_partial_hours  before start -> refund_partial_percent
--   otherwise (and no-show)                -> 0%
--
-- Reads: ops, the refund initiator, and the paying mentee. Writes go through
-- gated server code using the service_role key.
-- ============================================================================

alter table public.mentorship_settings
  add column if not exists refund_full_hours int not null default 24
    check (refund_full_hours >= 0);
alter table public.mentorship_settings
  add column if not exists refund_partial_hours int not null default 12
    check (refund_partial_hours >= 0);
alter table public.mentorship_settings
  add column if not exists refund_partial_percent numeric(5,2) not null default 50
    check (refund_partial_percent >= 0 and refund_partial_percent <= 100);

do $$ begin
  create type public.refund_status as enum ('pending','processed','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.refunds (
  id                 uuid primary key default gen_random_uuid(),
  payment_id         uuid not null references public.payments (id) on delete cascade,
  booking_id         uuid references public.session_bookings (id) on delete set null,
  amount             integer not null check (amount >= 0),   -- minor units
  currency           char(3) not null check (currency in ('NGN','USD','GHS','KES','ZAR')),
  reason             text,
  status             public.refund_status not null default 'pending',
  provider_reference text,
  initiated_by       uuid references public.members (id) on delete set null,
  created_at         timestamptz not null default now(),
  processed_at       timestamptz
);

create index if not exists refunds_payment_idx on public.refunds (payment_id);

alter table public.refunds enable row level security;

drop policy if exists refunds_select on public.refunds;
create policy refunds_select on public.refunds
  for select to authenticated
  using (
    public.is_operations()
    or initiated_by = auth.uid()
    or exists (
      select 1 from public.payments p
      where p.id = payment_id and p.payer_id = auth.uid()
    )
  );
