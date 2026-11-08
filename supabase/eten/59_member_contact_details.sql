-- ============================================================================
-- ETEN - 59 - Private contact details for every member (7 Nov 2026)
-- ----------------------------------------------------------------------------
-- Run AFTER 58. Safe to re-run.
--
-- Every member must now give a phone number, location, job title, years of
-- experience and a CV before using the member app (the "Your details" step).
-- Location, job title and experience live on profiles as before. The phone
-- number and LinkedIn link do NOT go on profiles, because every active
-- member can read profiles: they go in member_contact, which only the member
-- themselves can read. Pod Leaders and ETEN staff see them through the
-- server (roster export), never through the database directly.
--
--   member_contact.consent_at  when the member agreed to share these details
--   with their Pod Leaders and ETEN staff for community and client work
--   (Nigeria Data Protection Act 2023: purpose and consent recorded).
--
-- Backfill: early members applied through the community form with a phone
-- and LinkedIn. Those are copied in (no consent date: they still confirm on
-- the details step). Their CVs are already on profiles.resume_path.
-- ============================================================================

create table if not exists public.member_contact (
  member_id    uuid primary key references public.members (id) on delete cascade,
  phone        text,
  linkedin_url text,
  consent_at   timestamptz,
  updated_at   timestamptz not null default now()
);

drop trigger if exists member_contact_set_updated_at on public.member_contact;
create trigger member_contact_set_updated_at
  before update on public.member_contact
  for each row execute function public.set_updated_at();

alter table public.member_contact enable row level security;

-- A member reads their own row; writes go through the server only.
drop policy if exists member_contact_select_self on public.member_contact;
create policy member_contact_select_self on public.member_contact
  for select to authenticated
  using (member_id = auth.uid());

revoke insert, update, delete on public.member_contact from anon, authenticated;

-- Backfill from the original community applications (latest per email).
do $$
begin
  if to_regclass('public.community_applications') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'community_applications'
         and column_name = 'phone'
     ) then
    raise notice 'community_applications.phone not found; skipping backfill';
    return;
  end if;

  insert into public.member_contact (member_id, phone, linkedin_url)
  select distinct on (u.id)
         u.id,
         nullif(trim(ca.phone), ''),
         nullif(trim(ca.linkedin), '')
  from auth.users u
  join public.members m on m.id = u.id
  join public.community_applications ca on lower(ca.email) = lower(u.email)
  where coalesce(trim(ca.phone), '') <> '' or coalesce(trim(ca.linkedin), '') <> ''
  order by u.id, ca.created_at desc
  on conflict (member_id) do update
    set phone        = coalesce(public.member_contact.phone, excluded.phone),
        linkedin_url = coalesce(public.member_contact.linkedin_url, excluded.linkedin_url);
end $$;

-- Check: how many members have a phone on file now.
select count(*) filter (where phone is not null) as members_with_phone,
       count(*) filter (where consent_at is not null) as members_confirmed
from public.member_contact;
