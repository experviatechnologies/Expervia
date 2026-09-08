-- ============================================================================
-- ETEN Phase 1 — 06 · Profile résumé attachment  (step M0.2 follow-up)
-- ----------------------------------------------------------------------------
-- Run AFTER 01–05. Idempotent.
--
-- Gives a member profile a place to keep the résumé the person already uploaded
-- when they registered with Expervia. The existing-member migration (M0.2) reads
-- `community_applications.resume_path` and stores that same object path here, so
-- the résumé that lived in the private `resumes` bucket becomes a first-class
-- profile asset — no file is copied or re-uploaded, just referenced.
--
-- The object stays in the PRIVATE `resumes` bucket; downloads go out through
-- /api/member/resume as short-lived signed URLs, exactly like certificates.
--
-- We deliberately do NOT parse the résumé into structured fields here — that is a
-- separate, review-gated capability. This only preserves and re-surfaces the file.
-- ============================================================================

alter table public.profiles
  add column if not exists resume_path text;

comment on column public.profiles.resume_path is
  'Object path in the private `resumes` storage bucket for this member''s résumé, '
  'if any. Populated by the M0.2 existing-member migration from '
  'community_applications.resume_path. Served via /api/member/resume.';
