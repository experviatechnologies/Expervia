-- ============================================================================
-- ETEN Mentorship platform — 24 · Public verified-mentor directory (MP-6.2)
-- ----------------------------------------------------------------------------
-- Run AFTER 21–23. Idempotent (safe to re-run).
--
-- MP-6.2 RLS re-audit outcome: the Prospect tier is correctly contained. The
-- whole member community is gated by is_active_member(), which migration 22
-- tightened to also require validated_at, so a Prospect (validated_at IS NULL)
-- is locked out of the directory, pods, feed and DMs. Every mentorship table
-- (circles, sessions, assignments, submissions, mentor profiles/nominations,
-- recognition, evidence/passport, KYC) is scoped to owner / circle participant
-- / pod-lead / ops, and a Prospect owns none of those rows. Anonymous visitors
-- can read only capability_areas. All 38 public tables have RLS enabled. No
-- gate change was needed; validation stays self-serve by design (completing
-- onboarding stamps validated_at — see migration 22).
--
-- The one approved change is a funnel one: let Prospects and anonymous visitors
-- see the verified-mentor directory as social proof, WITHOUT exposing the
-- mentor_profiles table (which also carries verified_by and member linkage) or
-- the private profiles directory.
--
-- Mechanism: a read-only view projecting ONLY the safe fields (mentor tier,
-- capability area, verified date) for verified mentors. security_invoker = off
-- (the default) so the view reads its base tables with the owner's rights,
-- bypassing their RLS, and anon/authenticated get exactly this projection and
-- nothing else. No names or other PII are exposed; base-table RLS is unchanged.
-- ============================================================================

create or replace view public.public_verified_mentors
with (security_invoker = false) as
select
  mp.mentor_status,
  ca.slug  as capability_area_slug,
  ca.label as capability_area_label,
  mp.verified_at
from public.mentor_profiles mp
left join public.capability_areas ca on ca.id = mp.capability_area_id
where mp.verified_at is not null;

-- Expose the projection publicly; the underlying tables stay locked down.
grant select on public.public_verified_mentors to anon, authenticated;
