/**
 * Titles and meta descriptions for every public page, in one place so they
 * can be reviewed and tuned together. Nigeria is the primary market, Africa
 * the wider one. Keep titles under ~60 characters (the "| Expervia" suffix is
 * added by the root layout unless `absoluteTitle` is set) and descriptions
 * around 140 to 160. No em dashes in copy.
 */
export const PAGE_SEO = {
  "/": {
    title: "Expervia | AI, Cloud & Cybersecurity Partner in Nigeria",
    absoluteTitle: true,
    description:
      "Lagos-based Microsoft AI Cloud and Huawei Enterprise partner helping organisations in Nigeria and across Africa adopt AI, cloud, cybersecurity and data.",
  },
  "/about": {
    title: "About Us: Lagos-Based Technology Partner for Africa",
    description:
      "Meet Expervia Technologies, a Lagos, Nigeria technology company and Microsoft and Huawei partner building Africa's intelligent enterprises with AI and cloud.",
  },
  "/services": {
    title: "IT Services in Nigeria: AI, Cloud & Managed Services",
    description:
      "Enterprise IT services from Lagos: AI, cloud migration, cybersecurity, data and analytics, Microsoft solutions and managed services for Nigeria and Africa.",
  },
  "/industries": {
    title: "Technology Solutions for African Industries",
    description:
      "AI, cloud and cybersecurity for banking, government, healthcare, education, telecoms, energy and retail organisations in Nigeria and across Africa.",
  },
  "/solutions/ai": {
    title: "AI Solutions & Consulting in Nigeria and Africa",
    description:
      "Enterprise AI from Expervia: generative AI, Copilot, predictive analytics and intelligent automation, designed and governed for organisations across Africa.",
  },
  "/solutions/cloud": {
    title: "Cloud Migration & Azure Services in Nigeria",
    description:
      "Plan, migrate and run on Microsoft Azure and Huawei Cloud with a Lagos-based partner. Secure, cost-optimised cloud for businesses in Nigeria and Africa.",
  },
  "/solutions/cybersecurity": {
    title: "Cybersecurity Services in Nigeria and Africa",
    description:
      "Protect your organisation with security assessments, Zero Trust, identity, SOC monitoring and compliance support from Expervia, serving Nigeria and Africa.",
  },
  "/solutions/data": {
    title: "Data & Analytics Consulting in Nigeria",
    description:
      "Turn data into decisions with Microsoft Fabric, Power BI, data platforms and governance from Expervia, a Lagos data and analytics partner for Africa.",
  },
  "/solutions/microsoft": {
    title: "Microsoft Partner in Nigeria: Azure, M365 & Copilot",
    description:
      "Microsoft AI Cloud Partner in Lagos delivering Azure, Microsoft 365, Copilot, Dynamics 365 and Power Platform for organisations in Nigeria and Africa.",
  },
  "/events": {
    title: "Tech Events, Webinars & Masterclasses in Africa",
    description:
      "ETEN events by Expervia: webinars, masterclasses, workshops and meetups on Microsoft, cloud, AI, cybersecurity and data for professionals across Africa.",
  },
  "/contact": {
    title: "Contact Expervia in Lagos, Nigeria",
    description:
      "Talk to Expervia Technologies in Lagos about AI, cloud, cybersecurity or a free assessment. We serve clients in Nigeria and across Africa.",
  },
  "/join-eten": {
    title: "Join ETEN | Expervia Technologies Expert Network",
    absoluteTitle: true,
    description:
      "Join ETEN, the Expervia Technologies Expert Network: a community connecting technology professionals, emerging talent and experts in Nigeria and across Africa.",
  },
  "/community/huawei": {
    title: "Huawei Professionals Community in Africa",
    description:
      "Join Expervia's Pan-African network of Huawei-certified cloud, AI, security and infrastructure professionals, bridging certification and real project work.",
  },
  "/community/microsoft": {
    title: "Microsoft Professionals Community (EMPC)",
    description:
      "Join the Expervia Microsoft Professionals Community: Azure, security, data, AI and Modern Work professionals across Africa connected to enterprise projects.",
  },
  "/africa": {
    title: "IT Services Across Africa: 13 Countries We Serve",
    description:
      "From our Lagos headquarters, Expervia delivers AI, cloud and cybersecurity to organisations in Nigeria, Ghana, Kenya, Rwanda, South Africa and across Africa.",
  },
  "/mentorship": {
    title: "Tech Mentorship for African Professionals | ETEN",
    absoluteTitle: true,
    description:
      "Get matched with experienced technology mentors in cloud, AI, cybersecurity and data. Structured mentorship for professionals in Nigeria and across Africa.",
  },
} as const satisfies Record<
  string,
  { title: string; description: string; absoluteTitle?: boolean }
>;

export type SeoPath = keyof typeof PAGE_SEO;

/** Countries Expervia serves (all from Lagos, Nigeria). Nigeria is primary. */
export const AREA_SERVED = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "Rwanda",
  "South Africa",
  "Uganda",
  "Tanzania",
  "Egypt",
  "Côte d'Ivoire",
  "Senegal",
  "Cameroon",
  "Morocco",
  "Democratic Republic of the Congo",
] as const;
