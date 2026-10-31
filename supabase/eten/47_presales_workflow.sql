-- ============================================================================
-- ETEN Presales Tracker - 47 - Presales workflow tables (Phase 2, step 2.3)
-- ----------------------------------------------------------------------------
-- Run AFTER 46. Idempotent (safe to re-run).
--
-- Source: Expervia_ETEN_Availability_Tracker_PRD_v1.0, sections 5 (roles and
-- permissions), 6 (FR-014..FR-032), 8 (workflow and statuses), 10 and 12.
--
-- Workflow: Sales Manager creates a request -> routed to pods -> Pod Leaders
-- nominate -> Sales selects -> engineers accept/decline -> checks pass ->
-- confirmed -> outcome recorded.
--
-- Tables
--   presales_meeting_types     Controlled list of meeting categories.
--   presales_settings          Singleton: service levels, business hours,
--                              holidays, override rule, integrations.
--   presales_requests          One client meeting needing ETEN expertise.
--   presales_request_skills    Required skills (from the skills taxonomy).
--   presales_request_pods      Routing to pods, with deadline + response.
--   presales_nominations       Pod Leader nominations with justification.
--   presales_assignments       Selected engineers: invitation, response and
--                              calendar sync state (idempotent event writes).
--   presales_outcomes          Attendance is on assignments; this holds the
--   presales_outcome_actions   summary, tag, next steps and action owners.
--   presales_activity          Append-only history shown on each request.
--
-- Access (enforced here as defence in depth; every write goes through
-- role-checked server actions using the service_role key, so there are no
-- client write policies):
--   * Sales, Management, operations: read everything (is_presales_staff()).
--   * Pod Leaders: requests routed to a pod they lead, except RESTRICTED ones,
--     read through presales_requests_for_leads, which hides the client of a
--     CONFIDENTIAL request until an engineer has been selected.
--   * Engineers: requests they have been selected for, and their own invites.
--   * Drafts: staff only.
-- Request status changes are checked by a trigger so an invalid jump (for
-- example draft -> confirmed) is rejected even if the server code is wrong.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.presales_access as enum ('standard','confidential','restricted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.presales_urgency as enum ('standard','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.presales_request_status as enum (
    'draft','open','nominations_received','selection','awaiting_acceptance',
    'conflict','confirmed','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.presales_routing_status as enum ('awaiting','nominated','none_suitable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.presales_nomination_status as enum
    ('submitted','selected','not_selected','withdrawn','replaced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.presales_participant_status as enum (
    'invitation_pending','accepted','declined','confirmed','replaced',
    'cancelled','attended','absent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.calendar_sync_status as enum
    ('not_synced','pending','created','failed','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.presales_outcome_tag as enum ('progressed','follow_up','on_hold','lost');
exception when duplicate_object then null; end $$;

-- In-app notifications for the tracker reuse the notifications table.
alter type public.notification_type add value if not exists 'presales';

-- ----------------------------------------------------------------------------
-- Reference data
-- ----------------------------------------------------------------------------
create table if not exists public.presales_meeting_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.presales_meeting_types (name, sort) values
  ('Client discovery meeting', 1),
  ('Presales consultation', 2),
  ('Technical demonstration', 3),
  ('Solution architecture discussion', 4),
  ('Technical proposal review', 5),
  ('Cybersecurity consultation', 6)
on conflict (name) do nothing;

create table if not exists public.presales_settings (
  id                     boolean primary key default true check (id),
  standard_hours         int not null default 4  check (standard_hours between 1 and 200),
  urgent_hours           int not null default 2  check (urgent_hours between 1 and 200),
  response_hours         int not null default 24 check (response_hours between 1 and 336),
  fresh_days             int not null default 14 check (fresh_days between 1 and 365),
  reminder_weekday       smallint not null default 1 check (reminder_weekday between 1 and 7),
  timezone               text not null default 'Africa/Lagos',
  allow_direct_selection boolean not null default true,
  working_days           smallint[] not null default '{1,2,3,4,5}',
  opens_at               time not null default '09:00',
  closes_at              time not null default '17:00',
  -- [{ "date": "2026-12-25", "name": "Christmas Day" }, ...]
  holidays               jsonb not null default '[]',
  outlook_enabled        boolean not null default false,
  google_enabled         boolean not null default false,
  updated_by             uuid references public.members (id) on delete set null,
  updated_at             timestamptz not null default now(),
  constraint presales_settings_hours check (closes_at > opens_at)
);

insert into public.presales_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists presales_settings_set_updated_at on public.presales_settings;
create trigger presales_settings_set_updated_at before update on public.presales_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Requests
-- ----------------------------------------------------------------------------
create sequence if not exists public.presales_ref_seq;

create table if not exists public.presales_requests (
  id               uuid primary key default gen_random_uuid(),
  ref              text not null unique,
  title            text not null check (length(trim(title)) > 0),
  client           text not null check (length(trim(client)) > 0),
  opportunity_ref  text,
  objective        text not null default '',
  meeting_type_id  uuid references public.presales_meeting_types (id) on delete set null,
  access           public.presales_access not null default 'standard',
  seniority        public.seniority_level not null default 'senior',
  needed           int not null default 1 check (needed between 1 and 20),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  timezone         text not null default 'Africa/Lagos',
  format           public.meeting_format not null default 'online',
  platform         text,
  join_link        text,
  location         text,
  tech_prep        text,
  prep_notes       text,
  urgency          public.presales_urgency not null default 'standard',
  response_hours   int not null default 24 check (response_hours between 1 and 336),
  owner_id         uuid not null references public.members (id) on delete restrict,
  status           public.presales_request_status not null default 'draft',
  submitted_at     timestamptz,
  confirmed_at     timestamptz,
  cancelled_at     timestamptz,
  cancelled_reason text,
  -- Authorised direct selection without a nomination (PRD FR-018 override).
  override_reason  text,
  override_by      uuid references public.members (id) on delete set null,
  override_at      timestamptz,
  -- Why the Sales Manager chose these engineers (FR-032).
  rationale        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint presales_requests_times check (ends_at > starts_at and ends_at - starts_at <= interval '12 hours'),
  -- In-person meetings need a location once they leave draft.
  constraint presales_requests_location check (status = 'draft' or format = 'online' or coalesce(trim(location), '') <> ''),
  constraint presales_requests_cancel_reason check (status <> 'cancelled' or coalesce(trim(cancelled_reason), '') <> '')
);

create index if not exists presales_requests_status_idx on public.presales_requests (status);
create index if not exists presales_requests_starts_idx on public.presales_requests (starts_at);
create index if not exists presales_requests_owner_idx  on public.presales_requests (owner_id);

-- PSR-<year>-0001 references, assigned on insert.
create or replace function public.presales_assign_ref()
returns trigger language plpgsql as $$
begin
  if new.ref is null or new.ref = '' then
    new.ref := 'PSR-' || to_char(now() at time zone 'Africa/Lagos', 'YYYY') || '-'
               || lpad(nextval('public.presales_ref_seq')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists presales_requests_assign_ref on public.presales_requests;
create trigger presales_requests_assign_ref before insert on public.presales_requests
  for each row execute function public.presales_assign_ref();

drop trigger if exists presales_requests_set_updated_at on public.presales_requests;
create trigger presales_requests_set_updated_at before update on public.presales_requests
  for each row execute function public.set_updated_at();

-- Allowed status transitions (PRD section 8). Same-status updates are no-ops.
create or replace function public.presales_status_guard()
returns trigger language plpgsql as $$
declare
  ok boolean;
begin
  if new.status = old.status then
    return new;
  end if;
  ok := case old.status
    when 'draft'                then new.status in ('open','cancelled')
    when 'open'                 then new.status in ('nominations_received','selection','awaiting_acceptance','cancelled')
    when 'nominations_received' then new.status in ('open','selection','awaiting_acceptance','cancelled')
    when 'selection'            then new.status in ('open','nominations_received','awaiting_acceptance','conflict','cancelled')
    when 'awaiting_acceptance'  then new.status in ('selection','conflict','confirmed','cancelled')
    when 'conflict'             then new.status in ('selection','awaiting_acceptance','confirmed','cancelled')
    when 'confirmed'            then new.status in ('awaiting_acceptance','conflict','completed','cancelled')
    else false  -- completed and cancelled are final
  end;
  if not ok then
    raise exception 'Invalid presales request status change: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  -- Stamp lifecycle timestamps.
  if new.status = 'open' and new.submitted_at is null then new.submitted_at := now(); end if;
  if new.status = 'confirmed' then new.confirmed_at := now(); end if;
  if new.status = 'cancelled' then new.cancelled_at := now(); end if;
  return new;
end $$;

drop trigger if exists presales_requests_status_guard on public.presales_requests;
create trigger presales_requests_status_guard before update of status on public.presales_requests
  for each row execute function public.presales_status_guard();

create table if not exists public.presales_request_skills (
  request_id uuid not null references public.presales_requests (id) on delete cascade,
  skill_id   uuid not null references public.skills (id) on delete restrict,
  primary key (request_id, skill_id)
);

create table if not exists public.presales_request_pods (
  request_id   uuid not null references public.presales_requests (id) on delete cascade,
  pod_id       uuid not null references public.pods (id) on delete restrict,
  status       public.presales_routing_status not null default 'awaiting',
  deadline     timestamptz not null,
  responded_at timestamptz,
  responded_by uuid references public.members (id) on delete set null,
  -- Reason when the pod has no suitable candidate.
  note         text,
  primary key (request_id, pod_id)
);

create index if not exists presales_request_pods_pod_idx on public.presales_request_pods (pod_id, status);

-- ----------------------------------------------------------------------------
-- Nominations and assignments
-- ----------------------------------------------------------------------------
create table if not exists public.presales_nominations (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.presales_requests (id) on delete cascade,
  pod_id        uuid not null references public.pods (id) on delete restrict,
  member_id     uuid not null references public.members (id) on delete cascade,
  nominated_by  uuid references public.members (id) on delete set null,
  justification text not null check (length(trim(justification)) > 0),
  status        public.presales_nomination_status not null default 'submitted',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One live nomination per engineer per request (withdrawn ones can be redone).
create unique index if not exists presales_nominations_live_unique
  on public.presales_nominations (request_id, member_id) where status <> 'withdrawn';
create index if not exists presales_nominations_member_idx on public.presales_nominations (member_id);

drop trigger if exists presales_nominations_set_updated_at on public.presales_nominations;
create trigger presales_nominations_set_updated_at before update on public.presales_nominations
  for each row execute function public.set_updated_at();

create table if not exists public.presales_assignments (
  id                  uuid primary key default gen_random_uuid(),
  request_id          uuid not null references public.presales_requests (id) on delete cascade,
  member_id           uuid not null references public.members (id) on delete cascade,
  nomination_id       uuid references public.presales_nominations (id) on delete set null,
  -- Selected without a nomination under the override rule.
  is_direct_selection boolean not null default false,
  status              public.presales_participant_status not null default 'invitation_pending',
  invited_at          timestamptz not null default now(),
  due_at              timestamptz not null,
  responded_at        timestamptz,
  decline_reason      text,
  -- Calendar event state (FR-023, FR-024). The idempotency key makes retries
  -- update the same external event instead of creating duplicates.
  sync_status         public.calendar_sync_status not null default 'not_synced',
  calendar_provider   text,
  external_event_id   text,
  sync_error          text,
  idempotency_key     uuid not null default gen_random_uuid() unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint presales_assignments_decline_reason check (status <> 'declined' or coalesce(trim(decline_reason), '') <> '')
);

-- An engineer holds at most one live seat on a request.
create unique index if not exists presales_assignments_live_unique
  on public.presales_assignments (request_id, member_id)
  where status not in ('replaced','cancelled','declined');
create index if not exists presales_assignments_member_idx on public.presales_assignments (member_id, status);

drop trigger if exists presales_assignments_set_updated_at on public.presales_assignments;
create trigger presales_assignments_set_updated_at before update on public.presales_assignments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Outcomes and history
-- ----------------------------------------------------------------------------
create table if not exists public.presales_outcomes (
  request_id  uuid primary key references public.presales_requests (id) on delete cascade,
  summary     text not null check (length(trim(summary)) > 0),
  tag         public.presales_outcome_tag not null,
  next_steps  text,
  recorded_by uuid references public.members (id) on delete set null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.presales_outcome_actions (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.presales_requests (id) on delete cascade,
  text       text not null check (length(trim(text)) > 0),
  owner_id   uuid references public.members (id) on delete set null,
  owner_name text,
  due_date   date,
  is_done    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists presales_outcome_actions_request_idx on public.presales_outcome_actions (request_id);

create table if not exists public.presales_activity (
  id         bigint generated always as identity primary key,
  request_id uuid not null references public.presales_requests (id) on delete cascade,
  -- null = the system (rechecks, scheduled jobs).
  actor_id   uuid references public.members (id) on delete set null,
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists presales_activity_request_idx on public.presales_activity (request_id, created_at);

-- ----------------------------------------------------------------------------
-- Access helpers
-- ----------------------------------------------------------------------------

-- Is the caller selected (any live or past seat) for this request?
create or replace function public.presales_is_participant(p_request_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.presales_assignments a
    where a.request_id = p_request_id
      and a.member_id = auth.uid()
      and a.status <> 'replaced'
  );
$$;

-- Does the caller lead a pod this (non-draft, non-restricted) request is routed to?
create or replace function public.presales_leads_request(p_request_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.presales_requests r
    join public.presales_request_pods rp on rp.request_id = r.id
    join public.pod_memberships pm on pm.pod_id = rp.pod_id
    where r.id = p_request_id
      and r.status <> 'draft'
      and r.access <> 'restricted'
      and pm.member_id = auth.uid()
      and pm.role_in_pod in ('lead','co_lead')
  );
$$;

-- Can the caller see this request at all? (PRD section 5)
create or replace function public.presales_can_see_request(p_request_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_presales_staff()
      or public.presales_is_participant(p_request_id)
      or public.presales_leads_request(p_request_id);
$$;

-- ----------------------------------------------------------------------------
-- Pod Leader view: routed requests with confidential details masked until an
-- engineer has been selected. Runs as the view owner (bypassing the base
-- table's staff-only policy) and filters rows itself with
-- presales_leads_request(), so a leader only ever sees their own pods' requests.
-- ----------------------------------------------------------------------------
create or replace view public.presales_requests_for_leads as
select
  r.id,
  r.ref,
  r.title,
  case
    when r.access = 'confidential'
     and not exists (
       select 1 from public.presales_assignments a
       where a.request_id = r.id and a.status not in ('replaced','cancelled')
     )
    then 'Confidential client'
    else r.client
  end as client,
  r.objective,
  r.meeting_type_id,
  r.access,
  r.seniority,
  r.needed,
  r.starts_at,
  r.ends_at,
  r.timezone,
  r.format,
  r.location,
  r.urgency,
  r.status,
  r.submitted_at,
  r.owner_id
from public.presales_requests r
where public.presales_leads_request(r.id);

-- ----------------------------------------------------------------------------
-- Row-level security
-- ----------------------------------------------------------------------------
alter table public.presales_meeting_types   enable row level security;
alter table public.presales_settings        enable row level security;
alter table public.presales_requests        enable row level security;
alter table public.presales_request_skills  enable row level security;
alter table public.presales_request_pods    enable row level security;
alter table public.presales_nominations     enable row level security;
alter table public.presales_assignments     enable row level security;
alter table public.presales_outcomes        enable row level security;
alter table public.presales_outcome_actions enable row level security;
alter table public.presales_activity        enable row level security;

-- Reference data: any active member (forms and labels need it).
drop policy if exists presales_meeting_types_select on public.presales_meeting_types;
create policy presales_meeting_types_select on public.presales_meeting_types
  for select to authenticated
  using (public.is_active_member() or public.is_operations());

drop policy if exists presales_settings_select on public.presales_settings;
create policy presales_settings_select on public.presales_settings
  for select to authenticated
  using (public.is_active_member() or public.is_operations());

-- Requests: staff, and engineers selected for them. Pod Leaders read through
-- presales_requests_for_leads (masked) rather than the base table.
drop policy if exists presales_requests_select on public.presales_requests;
create policy presales_requests_select on public.presales_requests
  for select to authenticated
  using (public.is_presales_staff() or public.presales_is_participant(id));

drop policy if exists presales_request_skills_select on public.presales_request_skills;
create policy presales_request_skills_select on public.presales_request_skills
  for select to authenticated
  using (public.presales_can_see_request(request_id));

drop policy if exists presales_request_pods_select on public.presales_request_pods;
create policy presales_request_pods_select on public.presales_request_pods
  for select to authenticated
  using (public.presales_can_see_request(request_id));

-- Nominations: staff, and the leaders of the nominating pod.
drop policy if exists presales_nominations_select on public.presales_nominations;
create policy presales_nominations_select on public.presales_nominations
  for select to authenticated
  using (
    public.is_presales_staff()
    or (public.is_pod_lead(pod_id) and public.presales_leads_request(request_id))
  );

-- Assignments: staff, the engineer, and the engineer's Pod Leaders on
-- requests routed to them (to arrange replacements after a decline).
drop policy if exists presales_assignments_select on public.presales_assignments;
create policy presales_assignments_select on public.presales_assignments
  for select to authenticated
  using (
    public.is_presales_staff()
    or member_id = auth.uid()
    or (public.leads_member(member_id) and public.presales_leads_request(request_id))
  );

-- Outcomes: staff and the meeting's participants.
drop policy if exists presales_outcomes_select on public.presales_outcomes;
create policy presales_outcomes_select on public.presales_outcomes
  for select to authenticated
  using (public.is_presales_staff() or public.presales_is_participant(request_id));

drop policy if exists presales_outcome_actions_select on public.presales_outcome_actions;
create policy presales_outcome_actions_select on public.presales_outcome_actions
  for select to authenticated
  using (public.is_presales_staff() or public.presales_is_participant(request_id));

drop policy if exists presales_activity_select on public.presales_activity;
create policy presales_activity_select on public.presales_activity
  for select to authenticated
  using (public.presales_can_see_request(request_id));

-- Lock down EXECUTE on the helpers (matches 02_functions.sql).
revoke all on function public.presales_is_participant(uuid) from public;
revoke all on function public.presales_leads_request(uuid) from public;
revoke all on function public.presales_can_see_request(uuid) from public;
grant execute on function public.presales_is_participant(uuid) to authenticated, service_role;
grant execute on function public.presales_leads_request(uuid) to authenticated, service_role;
grant execute on function public.presales_can_see_request(uuid) to authenticated, service_role;

-- The leads view is for signed-in users only.
revoke all on public.presales_requests_for_leads from public, anon;
grant select on public.presales_requests_for_leads to authenticated, service_role;
