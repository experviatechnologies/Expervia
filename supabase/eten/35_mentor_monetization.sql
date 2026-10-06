-- ============================================================================
-- ETEN Mentorship - 35 - Mentor monetization: session pricing (Track B / M-1)
-- ----------------------------------------------------------------------------
-- Run AFTER 34. Idempotent (safe to re-run).
--
-- First step of the Monetization & Payment module (Track B of the Availability
-- PRD; detailed in the "Monetization & Payment Integration" PRD). A verified
-- mentor publishes an optional paid-session pricing profile. Prices are shown
-- to mentees on the mentor's booking page; payment collection, commission,
-- the earnings ledger and payouts arrive in later steps.
--
-- Money is stored in MINOR UNITS (kobo/cents) as an integer, matching how the
-- payment provider (Paystack) represents amounts and avoiding floating-point
-- rounding. The currency column records the unit. A price of NGN 20,000 is
-- stored as 2000000. All the supported currencies are 2-decimal (x100) units.
--
-- Pricing is readable by any authenticated user (a mentee must see it before
-- booking); writes go only through a gated server action using the service_role
-- key, so there is no client write policy here (matches 32/34).
-- ============================================================================

create table if not exists public.mentor_pricing (
  member_id             uuid primary key references public.members (id) on delete cascade,
  paid_sessions_enabled boolean not null default false,
  currency              char(3) not null default 'NGN'
                          check (currency in ('NGN','USD','GHS','KES','ZAR')),
  -- Prices in minor units. Null = not offered. Cap is a sanity bound only.
  standard_amount       integer check (standard_amount   is null or (standard_amount   >= 0 and standard_amount   <= 1000000000)),
  specialist_amount     integer check (specialist_amount is null or (specialist_amount >= 0 and specialist_amount <= 1000000000)),
  expert_amount         integer check (expert_amount     is null or (expert_amount     >= 0 and expert_amount     <= 1000000000)),
  extension_enabled     boolean not null default false,
  extension_amount      integer check (extension_amount  is null or (extension_amount  >= 0 and extension_amount  <= 1000000000)),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Belt-and-braces (the server action enforces these too): if paid sessions
  -- are on, a standard price must exist; if extensions are on, so must a price.
  constraint mentor_pricing_standard_when_paid
    check (not paid_sessions_enabled or standard_amount is not null),
  constraint mentor_pricing_extension_when_enabled
    check (not extension_enabled or extension_amount is not null)
);

drop trigger if exists mentor_pricing_set_updated_at on public.mentor_pricing;
create trigger mentor_pricing_set_updated_at
  before update on public.mentor_pricing
  for each row execute function public.set_updated_at();

alter table public.mentor_pricing enable row level security;

drop policy if exists mentor_pricing_select on public.mentor_pricing;
create policy mentor_pricing_select on public.mentor_pricing
  for select to authenticated
  using (true);
