-- ============================================================================
-- ETEN - 67 - CRM tasks: follow-ups assigned to staff (25 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 66. Safe to re-run. Then re-run 65, so merging duplicates also
-- moves their tasks.
--
-- A task is something a staff member has to do, optionally about a contact
-- or a company ("Call Ada on Friday"). Completing a task is written to that
-- contact's or company's timeline by the app.
--
-- Access: CRM staff only (is_crm_staff(), SQL 64). The app writes with the
-- service role after its own staff check.
-- ============================================================================

do $$ begin
  create type public.crm_task_type as enum
    ('todo', 'call', 'email', 'meeting', 'follow_up');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

create table if not exists public.crm_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(trim(title)) between 1 and 200),
  notes        text check (notes is null or length(notes) <= 2000),
  type         public.crm_task_type not null default 'todo',
  priority     public.crm_task_priority not null default 'medium',
  due_at       timestamptz,
  assignee_id  uuid references public.members (id) on delete set null,
  contact_id   uuid references public.crm_contacts (id) on delete cascade,
  company_id   uuid references public.crm_companies (id) on delete cascade,
  done_at      timestamptz,
  done_by      uuid references public.members (id) on delete set null,
  created_by   uuid references public.members (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Open tasks per person, soonest first (My tasks, sidebar count).
create index if not exists crm_tasks_open_assignee_idx
  on public.crm_tasks (assignee_id, due_at) where done_at is null;
create index if not exists crm_tasks_contact_idx on public.crm_tasks (contact_id);
create index if not exists crm_tasks_company_idx on public.crm_tasks (company_id);
create index if not exists crm_tasks_done_idx
  on public.crm_tasks (done_at desc) where done_at is not null;

drop trigger if exists crm_tasks_touch on public.crm_tasks;
create trigger crm_tasks_touch before update on public.crm_tasks
  for each row execute function public.crm_touch_updated_at();

alter table public.crm_tasks enable row level security;

drop policy if exists crm_tasks_staff on public.crm_tasks;
create policy crm_tasks_staff on public.crm_tasks
  for all to authenticated
  using (public.is_crm_staff()) with check (public.is_crm_staff());
