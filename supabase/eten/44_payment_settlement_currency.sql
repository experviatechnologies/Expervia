-- ============================================================================
-- ETEN Mentorship - 44 - Settlement currency on payments (multi-currency, PB-3)
-- ----------------------------------------------------------------------------
-- Run AFTER 43. Idempotent (safe to re-run).
--
-- The public booking page lets an international guest pay in USD for a mentor
-- who prices in another currency. The guest is charged the FX-converted amount
-- (so payments.amount / payments.currency are the USD actually charged, which
-- the settlement amount-integrity check verifies against Paystack), but the
-- mentor is always settled in their own base currency. These columns carry the
-- mentor's share in that base currency so the earnings ledger and payouts stay
-- single-currency per mentor.
--
-- All nullable. When null (every in-app payment and any same-currency guest
-- payment) the earning falls back to payments.currency / mentor_amount /
-- platform_fee, so existing behaviour is unchanged.
-- ============================================================================

alter table public.payments
  add column if not exists settlement_currency     char(3),
  add column if not exists settlement_mentor_amount integer,
  add column if not exists settlement_platform_fee  integer;

alter table public.payments
  drop constraint if exists payments_settlement_currency_chk;
alter table public.payments
  add constraint payments_settlement_currency_chk
    check (
      settlement_currency is null
      or settlement_currency in ('NGN', 'USD', 'GHS', 'KES', 'ZAR')
    );

alter table public.payments
  drop constraint if exists payments_settlement_amounts_chk;
alter table public.payments
  add constraint payments_settlement_amounts_chk
    check (
      (settlement_mentor_amount is null or settlement_mentor_amount >= 0)
      and (settlement_platform_fee is null or settlement_platform_fee >= 0)
    );
