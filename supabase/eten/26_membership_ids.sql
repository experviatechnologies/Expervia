-- ============================================================================
-- ETEN — 26 · Unique membership IDs (boss feedback item 7)
-- ----------------------------------------------------------------------------
-- Run AFTER 25. Idempotent (safe to re-run).
--
-- Every member gets a permanent, unique, human-readable ETEN membership ID of
-- the form ETN-000123 (a zero-padded sequence). It is assigned at account
-- creation, never reused, and stable for life: the member's stage (Prospect ->
-- Validated -> Verified -> Suspended/Deactivated) is derived from existing
-- fields (validated_at, member_verifications, status) and does NOT change the ID.
-- Deactivating an account keeps the ID (marked inactive in the app), never
-- deletes it.
-- ============================================================================

-- 1. Sequence backing the numeric part.
create sequence if not exists public.eten_membership_seq;

-- 2. The column (nullable at first; backfilled below, then indexed unique).
alter table public.members
  add column if not exists membership_id text;

-- 3. Assign an ID on insert when one was not supplied.
create or replace function public.assign_membership_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.membership_id is null then
    new.membership_id :=
      'ETN-' || lpad(nextval('public.eten_membership_seq')::text, 6, '0');
  end if;
  return new;
end $$;

drop trigger if exists members_assign_membership_id on public.members;
create trigger members_assign_membership_id
  before insert on public.members
  for each row execute function public.assign_membership_id();

-- 4. Backfill existing members deterministically, in join order. Re-run safe:
--    only rows still missing an ID are touched.
with ordered as (
  select id, row_number() over (order by created_at, id) as rn
  from public.members
  where membership_id is null
)
update public.members m
set membership_id = 'ETN-' || lpad(o.rn::text, 6, '0')
from ordered o
where m.id = o.id;

-- 5. Advance the sequence past the highest number in use so new members
--    continue from there (works whether or not any members existed).
select setval(
  'public.eten_membership_seq',
  (select coalesce(max(substring(membership_id from 5)::int), 0) from public.members) + 1,
  false
);

-- 6. Enforce uniqueness now that every row has a value.
create unique index if not exists members_membership_id_idx
  on public.members (membership_id);
