-- ============================================================================
-- ETEN — 13 · V-level readiness (V0–V5)  [Mentorship foundation M0.1]
-- ----------------------------------------------------------------------------
-- Run AFTER 01–12. Idempotent.
--
-- Adds the ETEN readiness level to the member identity. This is the V0–V5
-- model the Mentorship module reads ("current V-level") and mentees target.
--
--   V0 Registered · V1 Credential Verified · V2 Capability Verified ·
--   V3 Commercially Ready · V4 Proven Specialist · V5 Lead Specialist
--
-- Lives on public.members (identity), which is writable by operations only
-- (members_update_ops) — level changes are a Verification Desk / Readiness
-- Panel decision, never self-set and never automated. Everyone starts at V0.
-- ============================================================================

alter table public.members
  add column if not exists v_level smallint not null default 0;

do $$ begin
  alter table public.members
    add constraint members_v_level_range check (v_level between 0 and 5);
exception when duplicate_object then null; end $$;
