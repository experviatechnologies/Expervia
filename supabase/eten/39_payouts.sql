-- ============================================================================
-- ETEN Mentorship - 39 - Mentor payout accounts + payout runs (Monetization M-6)
-- ----------------------------------------------------------------------------
-- Run AFTER 38. Idempotent (safe to re-run).
--
-- A mentor adds one payout (bank) account; operations run a payout that sweeps a
-- mentor's AVAILABLE earnings (status='pending' and past the settlement hold)
-- into a single mentor_payouts record and marks those earnings 'paid'. V1 is
-- self-managed escrow with a MANUAL payout method: the payout is recorded here
-- and the actual bank transfer is done out-of-band (or via Paystack Transfers
-- later). bank_code is stored now so a Paystack Transfer can be wired in without
-- a schema change.
--
-- Reads: the owning mentor + operations. Writes go through gated server code
-- using the service_role key, so there are no client write policies.
-- ============================================================================

create table if not exists public.payout_accounts (
  member_id      uuid primary key references public.members (id) on delete cascade,
  bank_name      text not null,
  account_number text not null,
  account_name   text not null,
  bank_code      text,                 -- Paystack bank code (for future transfers)
  currency       char(3) not null default 'NGN'
                   check (currency in ('NGN','USD','GHS','KES','ZAR')),
  verified       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists payout_accounts_set_updated_at on public.payout_accounts;
create trigger payout_accounts_set_updated_at
  before update on public.payout_accounts
  for each row execute function public.set_updated_at();

do $$ begin
  create type public.payout_status as enum ('pending','processing','paid','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.mentor_payouts (
  id         uuid primary key default gen_random_uuid(),
  mentor_id  uuid not null references public.members (id) on delete restrict,
  amount     integer not null check (amount >= 0),   -- minor units, sum of net
  currency   char(3) not null check (currency in ('NGN','USD','GHS','KES','ZAR')),
  method     text not null default 'manual' check (method in ('manual','paystack')),
  status     public.payout_status not null default 'paid',
  reference  text,
  note       text,
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at    timestamptz
);

create index if not exists mentor_payouts_mentor_idx
  on public.mentor_payouts (mentor_id, created_at desc);

-- Link earnings to the payout that settled them.
do $$ begin
  alter table public.mentor_earnings
    add constraint mentor_earnings_payout_fk
    foreign key (payout_id) references public.mentor_payouts (id) on delete set null;
exception when duplicate_object then null; end $$;

alter table public.payout_accounts enable row level security;
alter table public.mentor_payouts  enable row level security;

drop policy if exists payout_accounts_select on public.payout_accounts;
create policy payout_accounts_select on public.payout_accounts
  for select to authenticated
  using (member_id = auth.uid() or public.is_operations());

drop policy if exists mentor_payouts_select on public.mentor_payouts;
create policy mentor_payouts_select on public.mentor_payouts
  for select to authenticated
  using (mentor_id = auth.uid() or public.is_operations());
