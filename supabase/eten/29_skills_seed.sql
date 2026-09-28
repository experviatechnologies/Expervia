-- ============================================================================
-- ETEN — 29 · Starter skills taxonomy
-- ----------------------------------------------------------------------------
-- Run AFTER 28. Idempotent: keyed on slug (on conflict do nothing).
--
-- The skills table shipped empty (skills were meant to be added via the ops
-- taxonomy console), which left onboarding and the mentor profile skills picker
-- with nothing to choose. This seeds a sensible starter set (~6 per specialist
-- pod, including the pods added in migration 25). Ops can edit, add, reorder or
-- deactivate any of these in /admin/taxonomy afterwards. Slugs are pod-prefixed
-- so they stay globally unique.
-- ============================================================================

insert into public.skills (slug, name, pod_id, sort)
select v.slug, v.name, p.id, v.sort
from (
  values
    -- Azure Infrastructure
    ('azure-infra', 'azure-infra-architecture', 'Azure Architecture', 1),
    ('azure-infra', 'azure-infra-networking', 'Azure Networking', 2),
    ('azure-infra', 'azure-infra-compute', 'Compute & VMs', 3),
    ('azure-infra', 'azure-infra-storage', 'Storage & Backup', 4),
    ('azure-infra', 'azure-infra-iac', 'Infrastructure as Code', 5),
    ('azure-infra', 'azure-infra-monitoring', 'Azure Monitoring', 6),
    -- Data & AI
    ('data-ai', 'data-ai-engineering', 'Data Engineering', 1),
    ('data-ai', 'data-ai-analytics', 'Analytics & Power BI', 2),
    ('data-ai', 'data-ai-ml', 'Machine Learning', 3),
    ('data-ai', 'data-ai-openai', 'Azure AI / OpenAI', 4),
    ('data-ai', 'data-ai-sql', 'SQL & Databases', 5),
    ('data-ai', 'data-ai-pipelines', 'Data Pipelines', 6),
    -- Modern Work (M365)
    ('modern-work', 'modern-work-admin', 'Microsoft 365 Admin', 1),
    ('modern-work', 'modern-work-teams', 'Microsoft Teams', 2),
    ('modern-work', 'modern-work-sharepoint', 'SharePoint & OneDrive', 3),
    ('modern-work', 'modern-work-exchange', 'Exchange Online', 4),
    ('modern-work', 'modern-work-intune', 'Intune & Endpoint', 5),
    ('modern-work', 'modern-work-copilot', 'Copilot for M365', 6),
    -- Security
    ('security', 'security-identity', 'Identity & Access (Entra ID)', 1),
    ('security', 'security-defender', 'Microsoft Defender', 2),
    ('security', 'security-sentinel', 'Microsoft Sentinel (SIEM)', 3),
    ('security', 'security-purview', 'Compliance & Purview', 4),
    ('security', 'security-zero-trust', 'Zero Trust', 5),
    ('security', 'security-threat', 'Threat Protection', 6),
    -- Business Applications
    ('biz-apps', 'biz-apps-d365', 'Dynamics 365', 1),
    ('biz-apps', 'biz-apps-power-apps', 'Power Apps', 2),
    ('biz-apps', 'biz-apps-power-automate', 'Power Automate', 3),
    ('biz-apps', 'biz-apps-power-bi', 'Power BI', 4),
    ('biz-apps', 'biz-apps-dataverse', 'Dataverse', 5),
    ('biz-apps', 'biz-apps-business-central', 'Business Central', 6),
    -- Developer Tools
    ('dev-tools', 'dev-tools-development', 'Software Development', 1),
    ('dev-tools', 'dev-tools-git', 'Git & Version Control', 2),
    ('dev-tools', 'dev-tools-cicd', 'CI/CD Pipelines', 3),
    ('dev-tools', 'dev-tools-apis', 'APIs & Integration', 4),
    ('dev-tools', 'dev-tools-testing', 'Testing & QA', 5),
    ('dev-tools', 'dev-tools-containers', 'Containers', 6),
    -- AWS
    ('aws', 'aws-compute', 'Compute (EC2)', 1),
    ('aws', 'aws-networking', 'Networking (VPC)', 2),
    ('aws', 'aws-storage', 'Storage (S3)', 3),
    ('aws', 'aws-iam', 'IAM & Security', 4),
    ('aws', 'aws-serverless', 'Serverless (Lambda)', 5),
    ('aws', 'aws-well-architected', 'Well-Architected', 6),
    -- Google Cloud
    ('gcp', 'gcp-compute', 'Compute Engine & GKE', 1),
    ('gcp', 'gcp-storage', 'Cloud Storage', 2),
    ('gcp', 'gcp-iam', 'IAM & Security', 3),
    ('gcp', 'gcp-bigquery', 'BigQuery & Data', 4),
    ('gcp', 'gcp-functions', 'Cloud Functions', 5),
    ('gcp', 'gcp-networking', 'Networking (VPC)', 6),
    -- Software Engineering
    ('software-engineering', 'swe-fundamentals', 'Programming Fundamentals', 1),
    ('software-engineering', 'swe-system-design', 'System Design', 2),
    ('software-engineering', 'swe-apis', 'APIs & Microservices', 3),
    ('software-engineering', 'swe-testing', 'Testing & TDD', 4),
    ('software-engineering', 'swe-databases', 'Databases & Modelling', 5),
    ('software-engineering', 'swe-patterns', 'Design Patterns', 6),
    -- DevOps
    ('devops', 'devops-cicd', 'CI/CD Pipelines', 1),
    ('devops', 'devops-docker', 'Docker', 2),
    ('devops', 'devops-kubernetes', 'Kubernetes', 3),
    ('devops', 'devops-terraform', 'Terraform (IaC)', 4),
    ('devops', 'devops-observability', 'Observability', 5),
    ('devops', 'devops-sre', 'Site Reliability (SRE)', 6),
    -- ISC2 Cybersecurity
    ('isc2-cybersecurity', 'isc2-secops', 'Security Operations', 1),
    ('isc2-cybersecurity', 'isc2-iam', 'Identity & Access Management', 2),
    ('isc2-cybersecurity', 'isc2-network-security', 'Network Security', 3),
    ('isc2-cybersecurity', 'isc2-cryptography', 'Cryptography', 4),
    ('isc2-cybersecurity', 'isc2-risk', 'Risk Management', 5),
    ('isc2-cybersecurity', 'isc2-incident-response', 'Incident Response', 6),
    -- ISACA Cybersecurity
    ('isaca-cybersecurity', 'isaca-audit', 'IT Audit (CISA)', 1),
    ('isaca-cybersecurity', 'isaca-risk', 'Risk & Controls (CRISC)', 2),
    ('isaca-cybersecurity', 'isaca-security-mgmt', 'Security Management (CISM)', 3),
    ('isaca-cybersecurity', 'isaca-governance', 'Governance (COBIT)', 4),
    ('isaca-cybersecurity', 'isaca-compliance', 'Compliance', 5),
    ('isaca-cybersecurity', 'isaca-assurance', 'Security Assurance', 6)
) as v(pod_slug, slug, name, sort)
join public.pods p on p.slug = v.pod_slug
on conflict (slug) do nothing;
