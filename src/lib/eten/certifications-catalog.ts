/**
 * Curated suggestions for the certification form's typeahead (a plain <datalist>,
 * so members can still type anything not listed). Consistent names make the ops
 * verification queue (M1.8) and the future talent search far cleaner.
 *
 * Weighted toward ETEN's community tracks (Microsoft, Huawei) and the six pod
 * domains — cloud, security, data, AI, networking, infrastructure — without
 * trying to be exhaustive.
 */

export const CERT_NAME_SUGGESTIONS: string[] = [
  // Microsoft — Azure
  "Microsoft Certified: Azure Fundamentals (AZ-900)",
  "Microsoft Certified: Azure Administrator Associate (AZ-104)",
  "Microsoft Certified: Azure Developer Associate (AZ-204)",
  "Microsoft Certified: Azure Solutions Architect Expert (AZ-305)",
  "Microsoft Certified: Azure Security Engineer Associate (AZ-500)",
  "Microsoft Certified: DevOps Engineer Expert (AZ-400)",
  // Microsoft — Data & AI
  "Microsoft Certified: Azure Data Fundamentals (DP-900)",
  "Microsoft Certified: Azure Data Engineer Associate (DP-203)",
  "Microsoft Certified: Azure AI Fundamentals (AI-900)",
  "Microsoft Certified: Azure AI Engineer Associate (AI-102)",
  "Microsoft Certified: Fabric Analytics Engineer Associate (DP-600)",
  "Microsoft Certified: Power BI Data Analyst Associate (PL-300)",
  // Microsoft — Security / M365
  "Microsoft Certified: Security, Compliance, and Identity Fundamentals (SC-900)",
  "Microsoft Certified: Identity and Access Administrator Associate (SC-300)",
  "Microsoft Certified: Security Operations Analyst Associate (SC-200)",
  "Microsoft 365 Certified: Fundamentals (MS-900)",
  "Microsoft 365 Certified: Administrator Expert (MS-102)",

  // Huawei
  "Huawei Certified ICT Associate (HCIA)",
  "Huawei Certified ICT Professional (HCIP)",
  "Huawei Certified ICT Expert (HCIE)",
  "HCIA-Cloud Computing",
  "HCIP-Cloud Computing",
  "HCIA-Datacom",
  "HCIP-Datacom",
  "HCIE-Datacom",
  "HCIA-Security",
  "HCIP-Security",
  "HCIA-AI",
  "HCIA-Big Data",
  "HCIA-Storage",

  // AWS
  "AWS Certified Cloud Practitioner",
  "AWS Certified Solutions Architect – Associate",
  "AWS Certified Solutions Architect – Professional",
  "AWS Certified Developer – Associate",
  "AWS Certified SysOps Administrator – Associate",
  "AWS Certified Security – Specialty",
  "AWS Certified Data Engineer – Associate",

  // Google Cloud
  "Google Cloud Certified: Associate Cloud Engineer",
  "Google Cloud Certified: Professional Cloud Architect",
  "Google Cloud Certified: Professional Data Engineer",
  "Google Cloud Certified: Professional Cloud Security Engineer",

  // Security (vendor-neutral)
  "CompTIA Security+",
  "CompTIA Network+",
  "CompTIA A+",
  "Certified Information Systems Security Professional (CISSP)",
  "Certified Information Security Manager (CISM)",
  "Certified Ethical Hacker (CEH)",
  "Certified Cloud Security Professional (CCSP)",
  "Cisco Certified Network Associate (CCNA)",
  "Cisco Certified Network Professional (CCNP)",

  // Data / project / other
  "Certified Kubernetes Administrator (CKA)",
  "HashiCorp Certified: Terraform Associate",
  "Project Management Professional (PMP)",
  "Certified ScrumMaster (CSM)",
  "ITIL 4 Foundation",
  "Oracle Certified Professional (OCP)",
  "Salesforce Certified Administrator",
  "TOGAF Enterprise Architecture",
];

export const CERT_ISSUER_SUGGESTIONS: string[] = [
  "Microsoft",
  "Huawei",
  "Amazon Web Services (AWS)",
  "Google Cloud",
  "CompTIA",
  "(ISC)²",
  "ISACA",
  "EC-Council",
  "Cisco",
  "Cloud Native Computing Foundation (CNCF)",
  "HashiCorp",
  "Project Management Institute (PMI)",
  "Scrum Alliance",
  "Axelos",
  "Oracle",
  "Salesforce",
  "The Open Group",
];
