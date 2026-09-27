/**
 * Content for the reusable public pod / certification landing template at
 * /community/[slug]. Each entry drives one page: hero, what the pod covers, the
 * certification pathway, and who it is for. Add a pod by adding an entry here;
 * the slug must match the pod slug seeded in the database (migration 25).
 */

export type CertStep = { level: string; name: string };

export type PodLanding = {
  slug: string;
  /** Short kicker above the headline, e.g. "AWS Professionals Pod". */
  eyebrow: string;
  /** Display name. */
  name: string;
  /** Hero headline. */
  tagline: string;
  /** Hero paragraph. */
  intro: string;
  /** What the pod covers. */
  covers: string[];
  /** Progression of credentials or capability levels. */
  pathwayLabel: string;
  pathway: CertStep[];
  /** Who the pod is for. */
  audience: string[];
};

export const POD_LANDINGS: Record<string, PodLanding> = {
  aws: {
    slug: "aws",
    eyebrow: "AWS Professionals Pod",
    name: "AWS Professionals",
    tagline: "Build and prove your Amazon Web Services capability.",
    intro:
      "A pod for cloud engineers, architects and operators working on AWS. Grow from foundational cloud skills to professional-level architecture with guidance from verified practitioners and a clear certification pathway.",
    covers: [
      "Cloud architecture and Well-Architected design",
      "Compute, storage, networking and serverless",
      "Security, identity and cost optimisation",
      "Migration, resilience and operations",
    ],
    pathwayLabel: "AWS certification pathway",
    pathway: [
      { level: "Foundational", name: "AWS Certified Cloud Practitioner" },
      {
        level: "Associate",
        name: "Solutions Architect / SysOps / Developer Associate",
      },
      {
        level: "Professional",
        name: "Solutions Architect Professional / DevOps Engineer Professional",
      },
      {
        level: "Specialty",
        name: "Security, Networking, Data or ML Specialty",
      },
    ],
    audience: [
      "Cloud engineers and administrators",
      "Solutions and enterprise architects",
      "Developers moving to the cloud",
      "Certification candidates",
    ],
  },
  gcp: {
    slug: "gcp",
    eyebrow: "Google Cloud Professionals Pod",
    name: "Google Cloud Professionals",
    tagline: "Grow your Google Cloud Platform expertise.",
    intro:
      "A pod for professionals building on Google Cloud, from data and infrastructure to security and DevOps. Develop practical capability and work toward Google Cloud credentials with a verified mentor.",
    covers: [
      "Cloud architecture and infrastructure",
      "Data engineering and analytics",
      "Security engineering and identity",
      "DevOps, SRE and automation",
    ],
    pathwayLabel: "Google Cloud certification pathway",
    pathway: [
      { level: "Foundational", name: "Cloud Digital Leader" },
      { level: "Associate", name: "Associate Cloud Engineer" },
      {
        level: "Professional",
        name: "Professional Cloud Architect / Data Engineer",
      },
      {
        level: "Professional (specialised)",
        name: "Security Engineer / DevOps Engineer",
      },
    ],
    audience: [
      "Cloud and platform engineers",
      "Data engineers and analysts",
      "Security engineers",
      "Certification candidates",
    ],
  },
  "software-engineering": {
    slug: "software-engineering",
    eyebrow: "Software Engineering Pod",
    name: "Software Engineering",
    tagline: "Grow from writing code to designing systems.",
    intro:
      "A pod for software developers and engineers who want to deepen their craft, from application development through to architecture and technical leadership, with mentorship on real engineering practice.",
    covers: [
      "Application development and clean code",
      "APIs, data and system design",
      "Testing, quality and code review",
      "Architecture and technical leadership",
    ],
    pathwayLabel: "Capability pathway",
    pathway: [
      {
        level: "Foundations",
        name: "Programming, version control and testing",
      },
      { level: "Application", name: "Building and shipping real applications" },
      { level: "System design", name: "APIs, data modelling and architecture" },
      { level: "Leadership", name: "Technical leadership and mentoring" },
    ],
    audience: [
      "Junior and mid-level developers",
      "Self-taught and bootcamp engineers",
      "Engineers moving toward architecture",
      "Team leads growing their craft",
    ],
  },
  devops: {
    slug: "devops",
    eyebrow: "DevOps Pod",
    name: "DevOps",
    tagline: "Automate, ship and operate with confidence.",
    intro:
      "A pod for engineers building delivery pipelines, infrastructure and reliable operations. Move from CI/CD fundamentals to platform and reliability engineering with a clear certification pathway.",
    covers: [
      "CI/CD pipelines and automation",
      "Containers and orchestration",
      "Infrastructure as code",
      "Observability and reliability (SRE)",
    ],
    pathwayLabel: "DevOps certification pathway",
    pathway: [
      { level: "Foundations", name: "Linux, Git and CI/CD basics" },
      {
        level: "Containers",
        name: "Docker and Kubernetes (CKA / CKAD)",
      },
      {
        level: "Cloud DevOps",
        name: "AWS DevOps Professional / Azure DevOps (AZ-400)",
      },
      {
        level: "Platform & reliability",
        name: "Terraform Associate and SRE practice",
      },
    ],
    audience: [
      "Operations and infrastructure engineers",
      "Developers adopting DevOps",
      "Platform and SRE engineers",
      "Certification candidates",
    ],
  },
  "isc2-cybersecurity": {
    slug: "isc2-cybersecurity",
    eyebrow: "ISC2 Cybersecurity Pod",
    name: "ISC2 Cybersecurity Specialists",
    tagline: "Build a security career on the ISC2 pathway.",
    intro:
      "A pod for security professionals working toward ISC2 credentials, from entry-level certification to CISSP and cloud security. Learn from verified specialists and progress with a structured plan.",
    covers: [
      "Security operations and defence",
      "Identity, access and cryptography",
      "Risk, governance and compliance",
      "Cloud security architecture",
    ],
    pathwayLabel: "ISC2 certification pathway",
    pathway: [
      { level: "Entry", name: "Certified in Cybersecurity (CC)" },
      {
        level: "Practitioner",
        name: "Systems Security Certified Practitioner (SSCP)",
      },
      {
        level: "Professional",
        name: "Certified Information Systems Security Professional (CISSP)",
      },
      { level: "Cloud", name: "Certified Cloud Security Professional (CCSP)" },
    ],
    audience: [
      "Aspiring security professionals",
      "SOC and security analysts",
      "Security engineers and architects",
      "CISSP and CCSP candidates",
    ],
  },
  "isaca-cybersecurity": {
    slug: "isaca-cybersecurity",
    eyebrow: "ISACA Cybersecurity Pod",
    name: "ISACA Cybersecurity",
    tagline: "Grow in security, audit and governance with ISACA.",
    intro:
      "A pod for professionals in cybersecurity audit, risk and governance working toward ISACA credentials. Develop enterprise-grade capability with mentorship and a clear progression.",
    covers: [
      "Security audit and assurance",
      "Risk management and controls",
      "Information security management",
      "Governance of enterprise IT",
    ],
    pathwayLabel: "ISACA certification pathway",
    pathway: [
      { level: "Technical", name: "Cybersecurity Practitioner (CSX-P)" },
      { level: "Audit", name: "Certified Information Systems Auditor (CISA)" },
      {
        level: "Risk",
        name: "Certified in Risk and Information Systems Control (CRISC)",
      },
      {
        level: "Management",
        name: "Certified Information Security Manager (CISM)",
      },
    ],
    audience: [
      "IT auditors and assurance professionals",
      "Risk and compliance specialists",
      "Security and governance managers",
      "CISA, CISM and CRISC candidates",
    ],
  },
};

export function getPodLanding(slug: string): PodLanding | undefined {
  return POD_LANDINGS[slug];
}

export const POD_LANDING_SLUGS = Object.keys(POD_LANDINGS);
