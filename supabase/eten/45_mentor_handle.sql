-- ============================================================================
-- ETEN Mentorship - 45 - Mentor booking handle (custom /m/<handle> URL)
-- ----------------------------------------------------------------------------
-- Run AFTER 44. Idempotent (safe to re-run).
--
-- A verified mentor can claim a short, shareable handle so their public booking
-- page is reachable at /m/<handle> as well as /mentorship/book/<id>. Stored
-- lower-cased; the format check enforces a slug (2-31 chars, starts
-- alphanumeric) and a case-insensitive unique index keeps handles distinct.
-- Nullable: mentors without a handle are unaffected. Writes go through a gated
-- server action (service_role), so no client write policy is needed.
-- ============================================================================

alter table public.mentor_profiles
  add column if not exists handle text;

alter table public.mentor_profiles
  drop constraint if exists mentor_profiles_handle_format;
alter table public.mentor_profiles
  add constraint mentor_profiles_handle_format
    check (handle is null or handle ~ '^[a-z0-9][a-z0-9-]{1,30}$');

create unique index if not exists mentor_profiles_handle_unique
  on public.mentor_profiles (lower(handle))
  where handle is not null;
