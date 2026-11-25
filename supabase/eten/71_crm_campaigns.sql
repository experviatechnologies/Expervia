-- ============================================================================
-- ETEN - 71 - CRM email campaigns to lists (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 66 (lists). Safe to re-run.
--
-- A campaign is an email written in the CRM and sent to one CRM list (smart
-- or fixed), in batches. crm_campaign_recipients records every person it was
-- sent to (or skipped/failed), so a campaign can be sent over several days
-- and nobody gets it twice. Only contacts opted in to marketing email who
-- haven't unsubscribed are sent to; the app enforces that.
--
-- The admin console's Email broadcasts (SQL 30) are separate and unchanged.
-- Access: CRM staff only; the app writes with the service role.
-- ============================================================================

do $$ begin
  create type public.crm_campaign_status as enum ('draft', 'sending', 'sent');
exception when duplicate_object then null; end $$;

create table if not exists public.crm_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) between 1 and 120),
  list_id      uuid references public.crm_lists (id) on delete set null,
  subject      text not null default '' check (length(subject) <= 150),
  preview      text not null default '' check (length(preview) <= 150),
  -- Plain text; a blank line starts a new paragraph. {first_name} is filled in.
  body         text not null default '' check (length(body) <= 10000),
  cta_label    text check (cta_label is null or length(cta_label) <= 40),
  cta_url      text check (cta_url is null or cta_url ~ '^https://'),
  status       public.crm_campaign_status not null default 'draft',
  sent_count   int not null default 0,
  failed_count int not null default 0,
  created_by   uuid references public.members (id) on delete set null,
  first_sent_at timestamptz,
  last_sent_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists crm_campaigns_created_idx on public.crm_campaigns (created_at desc);

create table if not exists public.crm_campaign_recipients (
  campaign_id uuid not null references public.crm_campaigns (id) on delete cascade,
  contact_id  uuid not null references public.crm_contacts (id) on delete cascade,
  email       text not null,
  status      text not null check (status in ('sent', 'failed')),
  error       text,
  sent_at     timestamptz not null default now(),
  primary key (campaign_id, contact_id)
);

create index if not exists crm_campaign_recipients_contact_idx
  on public.crm_campaign_recipients (contact_id);

drop trigger if exists crm_campaigns_touch on public.crm_campaigns;
create trigger crm_campaigns_touch before update on public.crm_campaigns
  for each row execute function public.crm_touch_updated_at();

alter table public.crm_campaigns           enable row level security;
alter table public.crm_campaign_recipients enable row level security;

drop policy if exists crm_campaigns_staff on public.crm_campaigns;
create policy crm_campaigns_staff on public.crm_campaigns
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());

drop policy if exists crm_campaign_recipients_staff on public.crm_campaign_recipients;
create policy crm_campaign_recipients_staff on public.crm_campaign_recipients
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());
