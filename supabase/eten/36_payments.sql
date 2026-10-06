-- ============================================================================
-- ETEN Mentorship - 36 - Payments: collection, status machine, webhooks (M-2)
-- ----------------------------------------------------------------------------
-- Run AFTER 35. Idempotent (safe to re-run).
--
-- Payment layer for paid mentorship (Monetization & Payment PRD). V1 provider
-- is Paystack only, self-managed escrow: the mentee's full payment is collected
-- into ETEN's Paystack account and recorded here; the mentor's share is held in
-- our own ledger and paid out later (earnings in M-5, payouts in M-6). We do
-- NOT use Paystack split/subaccounts.
--
-- Money is in MINOR UNITS (kobo/cents), matching migration 35 and Paystack.
-- The platform commission and settlement hold are platform-wide config on
-- mentorship_settings (PRD defaults: 20% commission, 24h settlement hold); the
-- commission RATE in force is snapshotted onto each payment for audit.
--
-- A payment is only ever considered successful once the BACKEND has verified it
-- with Paystack (webhook + verify call). The frontend "success" screen is never
-- trusted. Webhook processing is idempotent via payment_events.
--
-- Reads: the payer (mentee), the receiving mentor, and operations. Webhook
-- events are service-role only. All writes go through server code using the
-- service_role key, so there are no client write policies.
-- ============================================================================

-- Platform-wide monetization defaults (PRD §3, §17). Added to the existing
-- single-row settings table; defaults seed immediately.
alter table public.mentorship_settings
  add column if not exists platform_commission_percent numeric(5,2) not null default 20
    check (platform_commission_percent >= 0 and platform_commission_percent <= 100);
alter table public.mentorship_settings
  add column if not exists settlement_hold_hours int not null default 24
    check (settlement_hold_hours >= 0);

-- Lifecycle of a payment (PRD §13). Lowercase to match our other enums.
do $$ begin
  create type public.payment_status as enum (
    'pending','processing','success','failed',
    'cancelled','refunded','partially_refunded','disputed'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id                      uuid primary key default gen_random_uuid(),
  payer_id                uuid not null references public.members (id) on delete restrict,   -- the mentee
  mentor_id               uuid not null references public.members (id) on delete restrict,   -- receives earnings
  -- What is being paid for. A session links to the booking; an extension links
  -- to the extension row (that table arrives in M-4, so no FK on it yet).
  purpose                 text not null default 'session' check (purpose in ('session','extension')),
  booking_id              uuid references public.session_bookings (id) on delete set null,
  extension_id            uuid,
  -- Amounts in minor units. amount = gross charged to the mentee.
  amount                  integer not null check (amount >= 0),
  currency                char(3) not null check (currency in ('NGN','USD','GHS','KES','ZAR')),
  commission_percent      numeric(5,2) not null,          -- snapshot of the rate applied
  platform_fee            integer not null check (platform_fee >= 0),   -- ETEN commission
  mentor_amount           integer not null check (mentor_amount >= 0),  -- amount - platform_fee
  payment_fee             integer check (payment_fee is null or payment_fee >= 0), -- Paystack fee (from verify)
  provider                text not null default 'paystack' check (provider in ('paystack','maplerad')),
  provider_transaction_id text,                           -- Paystack data.id (set on verify)
  reference               text not null unique,           -- our reference, sent to Paystack
  status                  public.payment_status not null default 'pending',
  payment_method          text,                           -- Paystack channel: card, bank, ...
  paid_at                 timestamptz,
  failed_at               timestamptz,
  refunded_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists payments_payer_idx   on public.payments (payer_id, created_at desc);
create index if not exists payments_mentor_idx  on public.payments (mentor_id, created_at desc);
create index if not exists payments_booking_idx on public.payments (booking_id);
create index if not exists payments_status_idx  on public.payments (status);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Raw webhook events, for idempotency and audit. A provider event is processed
-- at most once: the unique (provider, event_type, provider_event_id) index
-- makes a duplicate delivery a no-op (insert conflict => already handled).
-- ----------------------------------------------------------------------------
create table if not exists public.payment_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'paystack',
  event_type        text not null,
  provider_event_id text not null,                 -- Paystack data.id, as text
  reference         text,
  payload           jsonb,
  status            text not null default 'received'
                      check (status in ('received','processed','ignored','error')),
  received_at       timestamptz not null default now(),
  processed_at      timestamptz
);

create unique index if not exists payment_events_unique
  on public.payment_events (provider, event_type, provider_event_id);

-- ----------------------------------------------------------------------------
-- RLS: payer + mentor + operations can read payments; webhook events are
-- service-role only (no policy = no authenticated access). No client writes.
-- ----------------------------------------------------------------------------
alter table public.payments       enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (
    payer_id = auth.uid()
    or mentor_id = auth.uid()
    or public.is_operations()
  );
