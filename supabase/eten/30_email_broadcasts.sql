-- ============================================================================
-- ETEN — 30 · Custom email broadcast log (admin "Send email")
-- ----------------------------------------------------------------------------
-- Run AFTER 29. Idempotent (safe to re-run).
--
-- Records each custom email operations send from the admin console: the subject,
-- the audience it targeted, and how many messages were attempted / sent /
-- failed. Rows are written by the ops server action via the service_role key
-- (there is no client write policy). Operations can read the history.
-- ============================================================================

create table if not exists public.email_broadcasts (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  body            text,
  -- A human label for who it went to, e.g. "All members", "Prospects",
  -- "Pod: Azure Infrastructure", "Manual list".
  audience        text not null,
  recipient_count int not null default 0,
  sent_count      int not null default 0,
  failed_count    int not null default 0,
  sent_by         uuid references public.members (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists email_broadcasts_created_idx
  on public.email_broadcasts (created_at desc);

alter table public.email_broadcasts enable row level security;

drop policy if exists email_broadcasts_select_ops on public.email_broadcasts;
create policy email_broadcasts_select_ops on public.email_broadcasts
  for select to authenticated
  using (public.is_operations());
