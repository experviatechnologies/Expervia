-- ============================================================================
-- ETEN - 66 - CRM lists: smart (saved filters) and fixed (hand-picked) (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 65. Safe to re-run.
--
-- A smart list stores the contacts-list filters as JSON; its members are
-- worked out live, so they change as contacts change. A fixed list holds the
-- people staff added by hand, in crm_list_members. Lists are what email
-- campaigns will send to later.
--
-- Access: CRM staff only (is_crm_staff(), SQL 64). The app writes with the
-- service role after its own staff check.
-- ============================================================================

do $$ begin
  create type public.crm_list_kind as enum ('smart', 'fixed');
exception when duplicate_object then null; end $$;

create table if not exists public.crm_lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 120),
  description text check (description is null or length(description) <= 500),
  kind        public.crm_list_kind not null,
  -- Smart lists only: the contacts-list filters, e.g.
  -- {"view":"eten","account":"pending","source":"Facebook lead ad"}.
  filters     jsonb not null default '{}'::jsonb,
  created_by  uuid references public.members (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (kind = 'smart' or filters = '{}'::jsonb)
);

create unique index if not exists crm_lists_name_key
  on public.crm_lists (lower(trim(name)));

create table if not exists public.crm_list_members (
  list_id    uuid not null references public.crm_lists (id) on delete cascade,
  contact_id uuid not null references public.crm_contacts (id) on delete cascade,
  added_by   uuid references public.members (id) on delete set null,
  added_at   timestamptz not null default now(),
  primary key (list_id, contact_id)
);

create index if not exists crm_list_members_contact_idx
  on public.crm_list_members (contact_id);

-- Only fixed lists hold hand-picked members.
create or replace function public.crm_list_members_fixed_only()
returns trigger language plpgsql set search_path = public as $$
begin
  if (select kind from public.crm_lists where id = new.list_id) <> 'fixed' then
    raise exception 'People can only be added to a fixed list';
  end if;
  return new;
end $$;

drop trigger if exists crm_list_members_fixed_only on public.crm_list_members;
create trigger crm_list_members_fixed_only
  before insert on public.crm_list_members
  for each row execute function public.crm_list_members_fixed_only();

drop trigger if exists crm_lists_touch on public.crm_lists;
create trigger crm_lists_touch before update on public.crm_lists
  for each row execute function public.crm_touch_updated_at();

alter table public.crm_lists        enable row level security;
alter table public.crm_list_members enable row level security;

drop policy if exists crm_lists_staff on public.crm_lists;
create policy crm_lists_staff on public.crm_lists
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());

drop policy if exists crm_list_members_staff on public.crm_list_members;
create policy crm_list_members_staff on public.crm_list_members
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());
