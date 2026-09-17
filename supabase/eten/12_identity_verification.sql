-- ============================================================================
-- ETEN — 12 · Identity & Address verification (KYC)  [Phase 6, step 6.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–11. Idempotent.
--
-- Members upload identity (passport / driver's licence / NIN) and proof-of-
-- address documents; operations review and approve/reject them. Identity and
-- address are tracked INDEPENDENTLY (two separate verifications, two badges).
--
-- SECURITY / PII:
--   * We do NOT store the raw document number — ops verify from the uploaded
--     image alone, so the only PII we retain is the file itself.
--   * The file lives in the PRIVATE `verifications` storage bucket (create it in
--     the Supabase dashboard — Storage → New bucket → name "verifications",
--     Public = OFF). Uploads and downloads go through server routes using the
--     service_role key; downloads are short-lived signed URLs. There are no
--     member-facing storage policies — same model as `certificates`/`resumes`.
--   * This table is readable only by the owning member and operations (RLS).
--     A guard trigger stops members from self-verifying.
--
-- Reuses the existing public.verification_status enum ('unverified','verified',
-- 'rejected').
-- ============================================================================

do $$ begin
  create type public.verification_kind as enum ('identity','address');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.id_document_type as enum ('passport','drivers_license','nin');
exception when duplicate_object then null; end $$;

create table if not exists public.member_verifications (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,
  kind          public.verification_kind not null,
  -- Required for identity, null for address.
  document_type public.id_document_type,
  file_path     text not null,
  status        public.verification_status not null default 'unverified',
  reviewed_by   uuid references public.members (id) on delete set null,
  reviewed_at   timestamptz,
  review_note   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint member_verifications_doc_type_matches_kind check (
    (kind = 'identity' and document_type is not null)
    or (kind = 'address' and document_type is null)
  )
);

create index if not exists member_verifications_member_idx
  on public.member_verifications (member_id);
create index if not exists member_verifications_status_idx
  on public.member_verifications (status);

-- At most one PENDING submission per kind per member (no spam); re-submission
-- is allowed once a prior one is verified/rejected, and history is kept.
create unique index if not exists member_verifications_one_pending
  on public.member_verifications (member_id, kind)
  where status = 'unverified';

-- updated_at maintenance (function defined in 01_schema).
drop trigger if exists member_verifications_set_updated_at on public.member_verifications;
create trigger member_verifications_set_updated_at
  before update on public.member_verifications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Guard: members can never set the review fields; ops may set them freely.
-- ----------------------------------------------------------------------------
create or replace function public.guard_member_verification_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_operations() then
    return new;                         -- ops may set status/review fields
  end if;
  if tg_op = 'INSERT' then
    new.status      := 'unverified';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
  elsif tg_op = 'UPDATE' then
    new.status      := old.status;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;
  end if;
  return new;
end $$;

drop trigger if exists member_verifications_guard_review on public.member_verifications;
create trigger member_verifications_guard_review
  before insert or update on public.member_verifications
  for each row execute function public.guard_member_verification_review();

-- ----------------------------------------------------------------------------
-- RLS — own rows or ops (mirrors certifications).
-- ----------------------------------------------------------------------------
alter table public.member_verifications enable row level security;

drop policy if exists member_verifications_select on public.member_verifications;
create policy member_verifications_select on public.member_verifications
  for select to authenticated
  using (member_id = auth.uid() or public.is_operations());

drop policy if exists member_verifications_insert_self on public.member_verifications;
create policy member_verifications_insert_self on public.member_verifications
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists member_verifications_update on public.member_verifications;
create policy member_verifications_update on public.member_verifications
  for update to authenticated
  using (member_id = auth.uid() or public.is_operations())
  with check (member_id = auth.uid() or public.is_operations());

drop policy if exists member_verifications_delete on public.member_verifications;
create policy member_verifications_delete on public.member_verifications
  for delete to authenticated
  using (member_id = auth.uid() or public.is_operations());
