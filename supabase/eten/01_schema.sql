-- ============================================================================
-- ETEN Phase 1 — 01 · Schema (enums, tables, indexes, triggers)
-- ----------------------------------------------------------------------------
-- Step M0.3. Turns the approved data model (docs/eten/phase1-data-model.md)
-- into real Postgres objects. Run the files in this folder IN ORDER, once each,
-- in the Supabase SQL Editor (same project as community_applications):
--
--   01_schema.sql      <- you are here  (tables live here, no access rules yet)
--   02_functions.sql   RLS helper functions
--   03_rls.sql         enable RLS + policies (grants members their access)
--   04_seed.sql        the Main Community + 6 specialist pods
--
-- Every statement is idempotent and safe to re-run. This file creates NO
-- policies, so until 03_rls.sql runs these tables are reachable only by the
-- service_role key (RLS is enabled at the end here, with zero policies = deny).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums  (§3 of the data model). Wrapped so re-running is a no-op.
-- ----------------------------------------------------------------------------
do $$ begin create type public.member_status      as enum ('active','suspended','deactivated');            exception when duplicate_object then null; end $$;
do $$ begin create type public.member_origin      as enum ('self_signup','migrated');                       exception when duplicate_object then null; end $$;
do $$ begin create type public.platform_role      as enum ('member','operations');                          exception when duplicate_object then null; end $$;
do $$ begin create type public.pod_role           as enum ('member','lead','co_lead');                       exception when duplicate_object then null; end $$;
do $$ begin create type public.verification_status as enum ('unverified','verified','rejected');             exception when duplicate_object then null; end $$;
do $$ begin create type public.attachment_kind    as enum ('image','document','link','video');              exception when duplicate_object then null; end $$;
do $$ begin create type public.reaction_type      as enum ('like','insightful','celebrate','support');      exception when duplicate_object then null; end $$;
do $$ begin create type public.reaction_target    as enum ('post','comment');                               exception when duplicate_object then null; end $$;
do $$ begin create type public.notification_type  as enum ('mention','comment','reaction','message','pod_activity'); exception when duplicate_object then null; end $$;
do $$ begin create type public.notification_mode  as enum ('realtime','digest','off');                       exception when duplicate_object then null; end $$;
do $$ begin create type public.report_target      as enum ('post','comment','message','member');            exception when duplicate_object then null; end $$;
do $$ begin create type public.report_status      as enum ('open','actioned','dismissed');                  exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Shared triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
-- PODS  (created first: profiles + skills reference it, nothing references
-- these back, so it must exist before the identity/taxonomy tables below.)
-- ============================================================================

-- pods — Main Community + 6 specialist pods (seeded in 04_seed.sql).
create table if not exists public.pods (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  is_main     boolean not null default false,
  created_at  timestamptz not null default now()
);
-- At most one Main Community.
create unique index if not exists pods_single_main_idx
  on public.pods (is_main) where is_main;

-- ============================================================================
-- IDENTITY & PROFILE
-- ============================================================================

-- members — root ETEN identity, 1:1 with auth.users (same UUID).
create table if not exists public.members (
  id          uuid primary key references auth.users (id) on delete cascade,
  status      public.member_status not null default 'active',
  role        public.platform_role not null default 'member',
  origin      public.member_origin not null default 'self_signup',
  -- null = pre-provisioned (migrated) but not yet activated; profile stays
  -- private until the person claims the account via their invite link.
  claimed_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- profiles — presentational profile, 1:1 with members.
create table if not exists public.profiles (
  member_id                     uuid primary key references public.members (id) on delete cascade,
  full_name                     text not null,
  headline                      text,
  photo_url                     text,
  location                      text,
  bio                           text,
  languages                     text[],
  availability_status           text,
  job_title                     text,   -- was "current_role" in the data model;
                                        -- current_role is a reserved SQL keyword.
  years_experience              int,
  industry_experience           text,
  primary_specialization_pod_id uuid references public.pods (id) on delete set null,
  updated_at                    timestamptz not null default now()
);

-- certifications — many:1 with member. Seed of the Phase-3 talent database.
create table if not exists public.certifications (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.members (id) on delete cascade,
  name                text not null,
  credential_id       text,
  issuer              text,
  date_obtained       date,
  expiry_date         date,
  verification_status public.verification_status not null default 'unverified',
  verified_by         uuid references public.members (id) on delete set null,
  verified_at         timestamptz,
  certificate_path    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================================
-- TAXONOMY  (pods created near the top; skills + join tables here)
-- ============================================================================

-- skills — admin-managed taxonomy; doubles as the post-tag vocabulary.
create table if not exists public.skills (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name      text not null,
  pod_id    uuid not null references public.pods (id) on delete cascade,
  is_active boolean not null default true,
  sort      int
);

-- member_skills — member <-> skill secondary tags.
create table if not exists public.member_skills (
  member_id  uuid not null references public.members (id) on delete cascade,
  skill_id   uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, skill_id)
);

-- pod_memberships — member <-> pod, carries pod-level role.
create table if not exists public.pod_memberships (
  id          uuid primary key default gen_random_uuid(),
  pod_id      uuid not null references public.pods (id) on delete cascade,
  member_id   uuid not null references public.members (id) on delete cascade,
  role_in_pod public.pod_role not null default 'member',
  joined_at   timestamptz not null default now(),
  unique (pod_id, member_id)
);

-- ============================================================================
-- FEED
-- ============================================================================

create table if not exists public.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.members (id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  is_removed     boolean not null default false,
  removed_by     uuid references public.members (id) on delete set null,
  removed_reason text
);

-- post_targets — one row per destination pod (Main feed and/or pods).
create table if not exists public.post_targets (
  post_id uuid not null references public.posts (id) on delete cascade,
  pod_id  uuid not null references public.pods (id) on delete cascade,
  primary key (post_id, pod_id)
);

create table if not exists public.post_attachments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  kind         public.attachment_kind not null,
  storage_path text,   -- image/document (private storage)
  url          text,   -- link/video
  filename     text,
  mime         text,
  meta         jsonb,  -- link-preview card / video embed info
  created_at   timestamptz not null default now()
);

-- post_tags — tags drawn from the skills taxonomy.
create table if not exists public.post_tags (
  post_id  uuid not null references public.posts (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (post_id, skill_id)
);

-- comments — one level of threading (a reply cannot itself be replied to).
create table if not exists public.comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts (id) on delete cascade,
  author_id         uuid not null references public.members (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  body              text not null,
  created_at        timestamptz not null default now(),
  is_removed        boolean not null default false,
  removed_by        uuid references public.members (id) on delete set null,
  removed_reason    text
);

-- Enforce the single threading level: a reply's parent must be top-level.
create or replace function public.enforce_comment_depth()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.parent_comment_id is not null then
    if exists (
      select 1 from public.comments c
      where c.id = new.parent_comment_id
        and c.parent_comment_id is not null
    ) then
      raise exception 'comments may only be one level deep (cannot reply to a reply)';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists comments_enforce_depth on public.comments;
create trigger comments_enforce_depth
  before insert or update of parent_comment_id on public.comments
  for each row execute function public.enforce_comment_depth();

-- reactions — polymorphic over post/comment; one reaction per member per item.
create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,
  target_type   public.reaction_target not null,
  target_id     uuid not null,
  reaction_type public.reaction_type not null,
  created_at    timestamptz not null default now(),
  unique (member_id, target_type, target_id)
);

-- ============================================================================
-- MESSAGING
-- ============================================================================

create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  title      text,
  -- nullable so an NDPA erasure of the creator nulls this instead of failing the
  -- delete or cascading away everyone else's messages; set on insert (RLS below).
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  member_id       uuid not null references public.members (id) on delete cascade,
  joined_at       timestamptz not null default now(),
  last_read_at    timestamptz,
  primary key (conversation_id, member_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.members (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.message_attachments (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.messages (id) on delete cascade,
  storage_path text not null,
  filename     text,
  mime         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.members (id) on delete cascade,
  blocked_id uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ============================================================================
-- NOTIFICATIONS, REPORTS, AUDIT
-- ============================================================================

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.members (id) on delete cascade,
  type         public.notification_type not null,
  actor_id     uuid references public.members (id) on delete set null,
  target_type  text,
  target_id    uuid,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  member_id uuid not null references public.members (id) on delete cascade,
  category  public.notification_type not null,
  mode      public.notification_mode not null default 'realtime',
  primary key (member_id, category)
);

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.members (id) on delete cascade,
  target_type     public.report_target not null,
  target_id       uuid not null,
  reason          text not null,
  status          public.report_status not null default 'open',
  resolved_by     uuid references public.members (id) on delete set null,
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz not null default now()
);

-- audit_log — server-written only (no member policies; see 03_rls.sql).
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.members (id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  reason      text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists certifications_set_updated_at on public.certifications;
create trigger certifications_set_updated_at before update on public.certifications
  for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Indexes (FKs + common access paths)
-- ----------------------------------------------------------------------------
create index if not exists profiles_primary_pod_idx        on public.profiles (primary_specialization_pod_id);
create index if not exists certifications_member_idx        on public.certifications (member_id);
create index if not exists certifications_verif_idx         on public.certifications (verification_status);
create index if not exists skills_pod_idx                   on public.skills (pod_id);
create index if not exists member_skills_skill_idx          on public.member_skills (skill_id);
create index if not exists pod_memberships_member_idx       on public.pod_memberships (member_id);
create index if not exists pod_memberships_pod_idx          on public.pod_memberships (pod_id);
create index if not exists posts_author_idx                 on public.posts (author_id);
create index if not exists posts_created_idx                on public.posts (created_at desc);
create index if not exists post_targets_pod_idx             on public.post_targets (pod_id);
create index if not exists post_attachments_post_idx        on public.post_attachments (post_id);
create index if not exists post_tags_skill_idx              on public.post_tags (skill_id);
create index if not exists comments_post_idx                on public.comments (post_id);
create index if not exists comments_parent_idx              on public.comments (parent_comment_id);
create index if not exists reactions_target_idx             on public.reactions (target_type, target_id);
create index if not exists conv_participants_member_idx     on public.conversation_participants (member_id);
create index if not exists messages_conversation_idx        on public.messages (conversation_id, created_at desc);
create index if not exists message_attachments_message_idx  on public.message_attachments (message_id);
create index if not exists notifications_recipient_idx      on public.notifications (recipient_id, is_read, created_at desc);
create index if not exists reports_status_idx               on public.reports (status, created_at desc);
create index if not exists audit_log_actor_idx              on public.audit_log (actor_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Enable RLS on every table now (no policies yet = default deny for anon/auth;
-- the service_role key still bypasses RLS). Policies arrive in 03_rls.sql.
-- ----------------------------------------------------------------------------
alter table public.members                   enable row level security;
alter table public.profiles                  enable row level security;
alter table public.certifications            enable row level security;
alter table public.pods                      enable row level security;
alter table public.skills                    enable row level security;
alter table public.member_skills             enable row level security;
alter table public.pod_memberships           enable row level security;
alter table public.posts                     enable row level security;
alter table public.post_targets              enable row level security;
alter table public.post_attachments          enable row level security;
alter table public.post_tags                 enable row level security;
alter table public.comments                  enable row level security;
alter table public.reactions                 enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.message_attachments       enable row level security;
alter table public.blocks                    enable row level security;
alter table public.notifications             enable row level security;
alter table public.notification_preferences  enable row level security;
alter table public.reports                   enable row level security;
alter table public.audit_log                 enable row level security;
