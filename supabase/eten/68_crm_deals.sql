-- ============================================================================
-- ETEN - 68 - CRM deals: sales and partnership pipelines (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 67. Safe to re-run. Then re-run 65, so merging duplicates also
-- moves their deals.
--
-- Two pipelines, with stages defined in the app (src/lib/crm/deals.ts):
--   sales  Expervia Sales      qualified, discovery, proposal, negotiation, won, lost
--   eten   ETEN Partnerships   prospect, pitched, agreed, won, lost
-- The stage is stored as text and checked per pipeline below, so a typo can
-- never put a deal in a stage that does not exist.
--
-- Amounts are in minor units (kobo / cents), like payments (SQL 36).
-- crm_activities gains deal_id so a deal has its own timeline.
-- ============================================================================

create table if not exists public.crm_deals (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) between 1 and 160),
  pipeline     text not null check (pipeline in ('sales', 'eten')),
  stage        text not null,
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  currency     char(3) not null default 'NGN' check (currency in ('NGN', 'USD')),
  close_date   date,
  priority     text not null default 'medium'
                 check (priority in ('low', 'medium', 'high')),
  product      text check (product is null or length(product) <= 120),
  notes        text check (notes is null or length(notes) <= 2000),
  owner_id     uuid references public.members (id) on delete set null,
  contact_id   uuid references public.crm_contacts (id) on delete set null,
  company_id   uuid references public.crm_companies (id) on delete set null,
  -- Set when the deal reaches its pipeline's won or lost stage.
  closed_at    timestamptz,
  lost_reason  text check (lost_reason is null or length(lost_reason) <= 300),
  created_by   uuid references public.members (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint crm_deals_stage_valid check (
    (pipeline = 'sales' and stage in
       ('qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost'))
    or
    (pipeline = 'eten' and stage in
       ('prospect', 'pitched', 'agreed', 'won', 'lost'))
  )
);

create index if not exists crm_deals_pipeline_idx on public.crm_deals (pipeline, stage);
create index if not exists crm_deals_contact_idx  on public.crm_deals (contact_id);
create index if not exists crm_deals_company_idx  on public.crm_deals (company_id);
create index if not exists crm_deals_owner_idx    on public.crm_deals (owner_id);

drop trigger if exists crm_deals_touch on public.crm_deals;
create trigger crm_deals_touch before update on public.crm_deals
  for each row execute function public.crm_touch_updated_at();

-- closed_at follows the stage: set on reaching won/lost, cleared if reopened.
create or replace function public.crm_deals_closed_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.stage in ('won', 'lost') then
    if tg_op = 'INSERT' or old.stage is distinct from new.stage then
      new.closed_at := now();
    end if;
  else
    new.closed_at := null;
    new.lost_reason := null;
  end if;
  return new;
end $$;

drop trigger if exists crm_deals_closed_at on public.crm_deals;
create trigger crm_deals_closed_at before insert or update on public.crm_deals
  for each row execute function public.crm_deals_closed_at();

-- A deal has its own timeline.
alter table public.crm_activities
  add column if not exists deal_id uuid references public.crm_deals (id) on delete cascade;
create index if not exists crm_activities_deal_idx
  on public.crm_activities (deal_id, occurred_at desc);

alter table public.crm_activities drop constraint if exists crm_activities_check;
alter table public.crm_activities drop constraint if exists crm_activities_target;
alter table public.crm_activities add constraint crm_activities_target
  check (contact_id is not null or company_id is not null or deal_id is not null);

alter table public.crm_deals enable row level security;

drop policy if exists crm_deals_staff on public.crm_deals;
create policy crm_deals_staff on public.crm_deals
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());
