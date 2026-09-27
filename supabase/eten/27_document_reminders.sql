-- ============================================================================
-- ETEN — 27 · Missing-document reminders log (boss feedback item 8)
-- ----------------------------------------------------------------------------
-- Run AFTER 26. Idempotent (safe to re-run).
--
-- Records each nudge sent to a member who is missing onboarding documents
-- (verified identity / proof of address / a certification), so operations can
-- see when someone was last reminded and avoid spamming. Rows are written by
-- the ops server action via the service_role key; there is no client write
-- policy. Operations can read them.
-- ============================================================================

create table if not exists public.member_document_reminders (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.members (id) on delete cascade,
  -- Which gaps the reminder covered, e.g. {identity, address, certification}.
  kinds      text[] not null default '{}',
  sent_by    uuid references public.members (id) on delete set null,
  sent_at    timestamptz not null default now()
);

create index if not exists member_document_reminders_member_idx
  on public.member_document_reminders (member_id);

alter table public.member_document_reminders enable row level security;

drop policy if exists member_document_reminders_select_ops
  on public.member_document_reminders;
create policy member_document_reminders_select_ops
  on public.member_document_reminders
  for select to authenticated
  using (public.is_operations());
