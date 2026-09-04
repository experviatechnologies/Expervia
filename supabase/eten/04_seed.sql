-- ============================================================================
-- ETEN Phase 1 — 04 · Seed: the Main Community + 6 specialist pods
-- ----------------------------------------------------------------------------
-- Run LAST. Idempotent: keyed on slug, so re-running changes nothing.
--
-- The six specialist pods mirror the solution-area taxonomy already collected by
-- the Microsoft community form. CONFIRM the exact names/descriptions against
-- PRD Appendix B before launch — edit the `name`/`description` values below and
-- re-run (slugs are the stable key and should not change once posts reference
-- pods). Skills within each pod are added later via the ops taxonomy console.
-- ============================================================================

insert into public.pods (slug, name, description, is_main) values
  ('main',        'Main Community',       'The shared ETEN feed — announcements and cross-pod conversation.', true),
  ('azure-infra', 'Azure Infrastructure', 'Cloud infrastructure, networking, and platform engineering on Azure.', false),
  ('data-ai',     'Data & AI',            'Data platforms, analytics, machine learning, and applied AI.',        false),
  ('modern-work', 'Modern Work (M365)',   'Microsoft 365, collaboration, and the modern workplace.',            false),
  ('security',    'Security',             'Cybersecurity, identity, compliance, and threat protection.',        false),
  ('biz-apps',    'Business Applications','Dynamics 365, Power Platform, and business process solutions.',       false),
  ('dev-tools',   'Developer Tools',      'Software development, DevOps, and the developer toolchain.',          false)
on conflict (slug) do nothing;
