-- ============================================================================
-- ETEN - 64 - CRM core: contacts, companies and the activity timeline (24 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 63. Safe to re-run.
--
-- One CRM for every product (Expervia, Mentorship, Academy, Women in Tech).
-- A crm_contact is ONE PERSON. If they have a platform account it is linked by
-- member_id, so the CRM reads their product data instead of copying it. People
-- with no account yet (lead-ad prospects, customer leads) are contacts with
-- member_id null.
--
-- Every product reports what a person did as a crm_activities row (registered,
-- booked a session, paid, enrolled ...). That one table is the contact's
-- timeline, and it is how Academy plugs in later without changing this schema.
--
-- Access: staff only (operations, sales_manager, management) through
-- is_crm_staff(). The import script and product code write with service_role.
-- Members never read CRM tables: notes and lead status are internal.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Types
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.crm_audience as enum ('eten','customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_lifecycle as enum
    ('subscriber','lead','mql','sql','opportunity','customer','evangelist');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_lead_status as enum
    ('new','open','in_progress','connected','unqualified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_company_type as enum
    ('customer','prospect','partner','member_employer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_activity_type as enum
    ('note','email','call','meeting','form','stage','campaign','task','system');
exception when duplicate_object then null; end $$;

-- Which product an activity came from.
do $$ begin
  create type public.crm_product as enum
    ('expervia','mentorship','academy','women_in_tech','crm');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 1. Who may use the CRM
-- ----------------------------------------------------------------------------
create or replace function public.is_crm_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_operations()
      or public.has_staff_role('sales_manager')
      or public.has_staff_role('management');
$$;

-- ----------------------------------------------------------------------------
-- 2. Companies
-- ----------------------------------------------------------------------------
create table if not exists public.crm_companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  domain      text,
  industry    text,
  type        public.crm_company_type not null default 'prospect',
  city        text,
  country     text,
  phone       text,
  description text,
  owner_id    uuid references public.members (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Company names are matched case-insensitively (import and create forms).
create unique index if not exists crm_companies_name_key
  on public.crm_companies (lower(trim(name)));

-- ----------------------------------------------------------------------------
-- 3. Contacts (one row per person)
-- ----------------------------------------------------------------------------
create table if not exists public.crm_contacts (
  id            uuid primary key default gen_random_uuid(),
  -- Linked platform account. Null = no account yet.
  member_id     uuid unique references public.members (id) on delete set null,
  first_name    text not null default '',
  last_name     text not null default '',
  email         text check (email is null or email = lower(trim(email))),
  phone         text,                      -- E.164 where known, e.g. +2348012345678
  job_title     text,
  company_id    uuid references public.crm_companies (id) on delete set null,
  audience      public.crm_audience not null default 'eten',
  lifecycle     public.crm_lifecycle not null default 'lead',
  lead_status   public.crm_lead_status not null default 'new',
  owner_id      uuid references public.members (id) on delete set null,
  city          text,
  state         text,
  country       text,
  gender        text check (gender is null or gender in ('female','male')),
  -- Where we first heard of them, e.g. 'Facebook lead ad', 'Platform signup'.
  source        text,
  tags          text[] not null default '{}',
  -- Communities they belong to or asked to join, e.g. {'women-in-tech'}.
  communities   text[] not null default '{}',
  -- ETEN details that only matter until they have an account (solution area,
  -- pods, skills, availability). Linked members read these from their profile.
  eten          jsonb not null default '{}'::jsonb,
  email_opt_in  boolean not null default true,
  -- Set when a person needs a human check, e.g. 'phone_match' (their phone
  -- belongs to an account with a different email). Cleared once reviewed.
  review_reason text,
  -- Stable key from the import, so re-running it updates instead of duplicating.
  import_key    text unique,
  -- When the person first appeared (lead date / join date), not row creation.
  first_seen_at   timestamptz not null default now(),
  last_activity_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists crm_contacts_email_key
  on public.crm_contacts (email) where email is not null;
create index if not exists crm_contacts_phone_idx    on public.crm_contacts (phone);
create index if not exists crm_contacts_company_idx  on public.crm_contacts (company_id);
create index if not exists crm_contacts_owner_idx    on public.crm_contacts (owner_id);
create index if not exists crm_contacts_audience_idx on public.crm_contacts (audience, lifecycle);
create index if not exists crm_contacts_tags_idx     on public.crm_contacts using gin (tags);
create index if not exists crm_contacts_comm_idx     on public.crm_contacts using gin (communities);
create index if not exists crm_contacts_review_idx
  on public.crm_contacts (review_reason) where review_reason is not null;

-- ----------------------------------------------------------------------------
-- 4. Activity timeline
-- ----------------------------------------------------------------------------
create table if not exists public.crm_activities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references public.crm_contacts (id) on delete cascade,
  company_id  uuid references public.crm_companies (id) on delete cascade,
  type        public.crm_activity_type not null,
  product     public.crm_product not null default 'crm',
  -- Machine name of the event, e.g. 'lead_form_submitted', 'session_booked'.
  event       text,
  subject     text,
  body        text,
  payload     jsonb not null default '{}'::jsonb,
  -- Staff member who logged it. Null = recorded by the system.
  actor_id    uuid references public.members (id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  -- Stops the same import or webhook event being recorded twice.
  dedupe_key  text unique,
  check (contact_id is not null or company_id is not null)
);

create index if not exists crm_activities_contact_idx
  on public.crm_activities (contact_id, occurred_at desc);
create index if not exists crm_activities_company_idx
  on public.crm_activities (company_id, occurred_at desc);
create index if not exists crm_activities_recent_idx
  on public.crm_activities (occurred_at desc);

-- ----------------------------------------------------------------------------
-- 5. Housekeeping triggers
-- ----------------------------------------------------------------------------
create or replace function public.crm_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists crm_contacts_touch on public.crm_contacts;
create trigger crm_contacts_touch before update on public.crm_contacts
  for each row execute function public.crm_touch_updated_at();

drop trigger if exists crm_companies_touch on public.crm_companies;
create trigger crm_companies_touch before update on public.crm_companies
  for each row execute function public.crm_touch_updated_at();

-- A new activity moves the contact's "last activity" forward.
create or replace function public.crm_bump_last_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.contact_id is not null then
    update public.crm_contacts
       set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at)
     where id = new.contact_id;
  end if;
  return new;
end $$;

drop trigger if exists crm_activities_bump on public.crm_activities;
create trigger crm_activities_bump after insert on public.crm_activities
  for each row execute function public.crm_bump_last_activity();

-- ----------------------------------------------------------------------------
-- 6. Row level security: staff only
-- ----------------------------------------------------------------------------
alter table public.crm_companies  enable row level security;
alter table public.crm_contacts   enable row level security;
alter table public.crm_activities enable row level security;

drop policy if exists crm_companies_staff on public.crm_companies;
create policy crm_companies_staff on public.crm_companies
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());

drop policy if exists crm_contacts_staff on public.crm_contacts;
create policy crm_contacts_staff on public.crm_contacts
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());

-- Staff read every activity and may log their own; they cannot rewrite or
-- delete the timeline (system events and other people's notes stay intact).
drop policy if exists crm_activities_read on public.crm_activities;
create policy crm_activities_read on public.crm_activities
  for select to authenticated using (public.is_crm_staff());

drop policy if exists crm_activities_insert on public.crm_activities;
create policy crm_activities_insert on public.crm_activities
  for insert to authenticated
  with check (public.is_crm_staff() and actor_id = auth.uid());
