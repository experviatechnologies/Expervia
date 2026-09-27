-- ============================================================================
-- ETEN — 25 · Pod expansion (boss feedback item 1)
-- ----------------------------------------------------------------------------
-- Run AFTER 24. Idempotent: keyed on slug (on conflict do nothing), so
-- re-running changes nothing and it never touches the existing pods.
--
-- Adds the six new specialist pods from the 26 Sep 2026 review: AWS, Google
-- Cloud, Software Engineering, DevOps, and the two credential-aligned
-- cybersecurity pods (ISC2, ISACA). These sit alongside the existing pods
-- (azure-infra, data-ai, modern-work, security, biz-apps, dev-tools); the
-- overlaps are intentional per the review (credential-specific cyber pods, and
-- Software Engineering / DevOps split out from the general Developer Tools pod).
-- Landing pages and certification pathways are built in the app, not here.
-- ============================================================================

insert into public.pods (slug, name, description, is_main) values
  ('aws',                 'AWS Professionals',            'Amazon Web Services architecture, infrastructure, and cloud engineering.',                         false),
  ('gcp',                 'Google Cloud Professionals',   'Google Cloud Platform architecture, data, and cloud engineering.',                                 false),
  ('software-engineering','Software Engineering',         'Software design, application development, and engineering practice.',                               false),
  ('devops',             'DevOps',                        'CI/CD, automation, reliability, and platform operations.',                                         false),
  ('isc2-cybersecurity', 'ISC2 Cybersecurity Specialists','Cybersecurity aligned to ISC2 credentials such as CISSP, CCSP and SSCP.',                          false),
  ('isaca-cybersecurity','ISACA Cybersecurity',          'Cybersecurity, audit and governance aligned to ISACA credentials such as CISA, CISM and CRISC.',   false)
on conflict (slug) do nothing;
