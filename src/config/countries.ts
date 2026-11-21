/**
 * Country landing pages (/africa/<slug>). Expervia is based in Lagos and has
 * no offices, partners or clients claimed elsewhere: every other country is
 * served from Lagos (remote-first, with on-site visits when a project needs
 * them). Keep copy factual: market context and regulation only, no invented
 * statistics, offices or customers. Nigeria is the primary market.
 *
 * Each page carries its own intro, context, priorities, industries,
 * compliance note and FAQs, so the pages are genuinely different (thin,
 * templated location pages are treated as spam by search engines).
 */

/** Flip to true in SEO step 3, once the /fr/afrique pages exist: turns on
 * hreflang alternates and the "Lire en français" links. */
export const FRENCH_PAGES_LIVE = false;

export type SolutionKey =
  | "ai"
  | "cloud"
  | "cybersecurity"
  | "data"
  | "microsoft"
  | "managed";

export const SOLUTION_LINKS: Record<
  SolutionKey,
  { label: string; href: string }
> = {
  ai: { label: "AI & Intelligence", href: "/solutions/ai" },
  cloud: { label: "Cloud & Infrastructure", href: "/solutions/cloud" },
  cybersecurity: { label: "Cybersecurity", href: "/solutions/cybersecurity" },
  data: { label: "Data & Analytics", href: "/solutions/data" },
  microsoft: { label: "Microsoft Solutions", href: "/solutions/microsoft" },
  managed: { label: "Managed Services", href: "/services" },
};

export type Country = {
  slug: string;
  name: string;
  /** "in Nigeria", "in the DRC": how the name reads inside a sentence. */
  inName: string;
  region:
    | "West Africa"
    | "East Africa"
    | "Southern Africa"
    | "North Africa"
    | "Central Africa";
  /** ISO 3166-1 alpha-2, for hreflang and schema. */
  iso: string;
  hubs: string[];
  currency: string;
  timeZone: string;
  /** Also published in French at /fr/afrique/<frSlug> (step 3). */
  frSlug?: string;
  primary?: boolean;
  /** SEO title (the "| Expervia" suffix is added) and meta description. */
  title: string;
  description: string;
  /** Hero headline + intro. */
  headline: string;
  intro: string;
  /** Three short points about the market and why it matters. */
  context: { title: string; body: string }[];
  /** The services that matter most there, with a local reason. */
  priorities: { key: SolutionKey; why: string }[];
  industries: string[];
  compliance: string;
  delivery: string;
  faqs: { question: string; answer: string }[];
};

const LAGOS_DELIVERY = (inName: string, hubs: string) =>
  `We serve organisations ${inName} from our Lagos headquarters. Most work is delivered remotely in your working hours, and our consultants travel to ${hubs} for workshops, go-lives and anything that needs to happen on site.`;

export const COUNTRIES: Country[] = [
  {
    slug: "nigeria",
    name: "Nigeria",
    inName: "in Nigeria",
    region: "West Africa",
    iso: "NG",
    hubs: ["Lagos", "Abuja", "Port Harcourt"],
    currency: "Nigerian naira (NGN)",
    timeZone: "West Africa Time (UTC+1)",
    primary: true,
    title: "IT Services Company in Lagos, Nigeria: AI & Cloud",
    description:
      "Expervia is a Lagos IT services company and Microsoft and Huawei partner delivering AI, cloud, cybersecurity and data solutions for businesses across Nigeria.",
    headline: "Your Lagos Partner for AI, Cloud and Cybersecurity in Nigeria",
    intro:
      "Expervia Technologies is headquartered in Lekki, Lagos. We help Nigerian banks, fintechs, public institutions and growing enterprises modernise on Microsoft and Huawei technology, with local engineers who understand the market, the regulators and the realities of doing business here.",
    context: [
      {
        title: "Africa's largest digital market",
        body: "Nigeria's fintech, telecoms and e-commerce sectors set the pace for the continent, and customers expect digital services that are always on.",
      },
      {
        title: "Regulation is maturing fast",
        body: "The Nigeria Data Protection Act 2023 and sector rules from the CBN and NCC raise the bar on how data is stored, secured and reported.",
      },
      {
        title: "Cost and resilience matter",
        body: "Foreign-exchange swings and power reliability make cloud cost control and resilient architecture business priorities, not just IT ones.",
      },
    ],
    priorities: [
      {
        key: "cybersecurity",
        why: "Security assessments, identity and SOC monitoring aligned to NDPA 2023 and CBN cybersecurity expectations.",
      },
      {
        key: "cloud",
        why: "Azure and Huawei Cloud migrations designed for cost control in naira terms and resilience against local outages.",
      },
      {
        key: "ai",
        why: "Copilot and generative AI pilots for banks, telcos and public bodies, with governance built in from day one.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365, Dynamics 365 and Power Platform delivered by a local Microsoft AI Cloud Partner.",
      },
    ],
    industries: [
      "Banking and fintech",
      "Telecoms",
      "Oil, gas and energy",
      "Government and public sector",
      "Manufacturing and FMCG",
      "Education",
    ],
    compliance:
      "We design for the Nigeria Data Protection Act 2023 and NDPC guidance, CBN cybersecurity requirements for financial institutions and NCC rules for telecoms, including where personal and financial data is stored.",
    delivery:
      "Our team is on the ground in Lagos and works on site with clients in Lagos, Abuja and Port Harcourt, backed by remote engineering and support during Nigerian business hours.",
    faqs: [
      {
        question: "Where is Expervia based in Nigeria?",
        answer:
          "Our head office is at Lakowe Lakes Golf & Country Estate, Lekki, Lagos. We work on site across Lagos and travel to Abuja, Port Harcourt and other cities for client projects.",
      },
      {
        question:
          "Can you help us comply with the Nigeria Data Protection Act?",
        answer:
          "Yes. We assess how you collect, store and secure personal data, then design controls, cloud configuration and processes that support NDPA 2023 compliance. We work alongside your legal advisers rather than replacing them.",
      },
      {
        question: "Do you work with Nigerian banks and fintechs?",
        answer:
          "Financial services is one of our core industries. We support cloud adoption, security operations and data platforms that meet CBN expectations for resilience and cybersecurity.",
      },
      {
        question: "Can we pay in naira?",
        answer:
          "Yes, Nigerian clients are invoiced in naira. Talk to us about the structure that suits your project.",
      },
    ],
  },
  {
    slug: "ghana",
    name: "Ghana",
    inName: "in Ghana",
    region: "West Africa",
    iso: "GH",
    hubs: ["Accra", "Kumasi"],
    currency: "Ghanaian cedi (GHS)",
    timeZone: "Greenwich Mean Time (UTC+0)",
    title: "AI, Cloud & Cybersecurity Services in Ghana",
    description:
      "Expervia helps organisations in Accra and across Ghana adopt Microsoft cloud, AI, cybersecurity and data, delivered from Lagos with on-site support.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Ghana",
    intro:
      "Ghana's businesses and public institutions are moving quickly to cloud and digital services. Expervia brings Microsoft and Huawei expertise from Lagos, one hour away, to help Ghanaian organisations modernise securely and cost-effectively.",
    context: [
      {
        title: "A stable, growing tech scene",
        body: "Accra has become a regional base for fintech, mobile money and international tech companies, with strong demand for cloud and data skills.",
      },
      {
        title: "Digital public services",
        body: "Ghana's push to digitise identity, payments and government services makes secure, interoperable systems a priority.",
      },
      {
        title: "Close to Lagos",
        body: "A short flight and a one-hour time difference make Lagos-based delivery practical, with travel to Accra when projects need it.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Azure migrations and hybrid cloud for enterprises and public bodies modernising legacy systems.",
      },
      {
        key: "cybersecurity",
        why: "Security reviews and controls aligned with Ghana's Cybersecurity Act 2020 and Data Protection Act 2012.",
      },
      {
        key: "data",
        why: "Power BI and data platforms that turn mobile money, operational and customer data into decisions.",
      },
    ],
    industries: [
      "Banking and mobile money",
      "Government and public sector",
      "Mining and energy",
      "Telecoms",
      "Education",
    ],
    compliance:
      "We design with Ghana's Data Protection Act 2012 (Act 843) and the Cybersecurity Act 2020 (Act 1038) in mind, including registration expectations with the Data Protection Commission and the Cyber Security Authority.",
    delivery: LAGOS_DELIVERY("in Ghana", "Accra"),
    faqs: [
      {
        question: "Does Expervia have an office in Ghana?",
        answer:
          "No. We serve Ghanaian clients from our Lagos headquarters, working remotely in Ghana's business hours and travelling to Accra for on-site work when a project needs it.",
      },
      {
        question: "Which Ghanaian regulations do you design for?",
        answer:
          "We take the Data Protection Act 2012 and the Cybersecurity Act 2020 into account when we design cloud, data and security solutions, and work with your compliance team on the details.",
      },
      {
        question: "Can you support Microsoft 365 and Azure for Ghanaian teams?",
        answer:
          "Yes. As a Microsoft AI Cloud Partner we deliver Microsoft 365, Azure and Copilot projects, plus ongoing support.",
      },
    ],
  },
  {
    slug: "kenya",
    name: "Kenya",
    inName: "in Kenya",
    region: "East Africa",
    iso: "KE",
    hubs: ["Nairobi", "Mombasa"],
    currency: "Kenyan shilling (KES)",
    timeZone: "East Africa Time (UTC+3)",
    title: "AI, Cloud & Cybersecurity Services in Kenya",
    description:
      "Expervia supports organisations in Nairobi and across Kenya with Microsoft cloud, AI, cybersecurity and data solutions, delivered from Lagos and on site.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Kenya",
    intro:
      "Kenya's 'Silicon Savannah' is one of Africa's most mature digital economies. Expervia helps Kenyan enterprises, fintechs and institutions get more from Microsoft and Huawei technology, with secure cloud, practical AI and strong data foundations.",
    context: [
      {
        title: "Mobile money pioneer",
        body: "Kenya led the world in mobile money, and its financial services sector expects real-time, secure and highly available systems.",
      },
      {
        title: "A regional tech hub",
        body: "Nairobi hosts the East African offices of many global tech companies, creating demand for enterprise-grade cloud and AI.",
      },
      {
        title: "Data protection in force",
        body: "The Data Protection Act 2019 and the Office of the Data Protection Commissioner have made privacy a board-level topic.",
      },
    ],
    priorities: [
      {
        key: "ai",
        why: "Generative AI and Copilot adoption for enterprises and fintechs, with responsible-AI governance.",
      },
      {
        key: "cybersecurity",
        why: "Identity, Zero Trust and security monitoring for high-volume financial and digital services.",
      },
      {
        key: "data",
        why: "Modern data platforms and analytics that meet Kenya's data protection obligations.",
      },
    ],
    industries: [
      "Fintech and banking",
      "Telecoms",
      "Agriculture and agritech",
      "NGOs and development organisations",
      "Logistics",
    ],
    compliance:
      "Solutions are designed with Kenya's Data Protection Act 2019 and the Computer Misuse and Cybercrimes Act 2018 in mind, including data controller and processor obligations overseen by the ODPC.",
    delivery: LAGOS_DELIVERY("in Kenya", "Nairobi"),
    faqs: [
      {
        question: "How do you work with clients in Kenya from Lagos?",
        answer:
          "Most delivery is remote, scheduled around East Africa Time, with consultants travelling to Nairobi for workshops, go-lives and on-site work.",
      },
      {
        question: "Do you understand Kenya's Data Protection Act?",
        answer:
          "Yes. We design cloud, data and security solutions with the Data Protection Act 2019 in mind and work with your data protection officer on registration and policy details.",
      },
      {
        question:
          "Can you work with NGOs and development organisations in Nairobi?",
        answer:
          "Yes. We support Microsoft 365, secure collaboration and data reporting for NGOs and international organisations as well as commercial clients.",
      },
    ],
  },
  {
    slug: "rwanda",
    name: "Rwanda",
    inName: "in Rwanda",
    region: "East Africa",
    iso: "RW",
    hubs: ["Kigali"],
    currency: "Rwandan franc (RWF)",
    timeZone: "Central Africa Time (UTC+2)",
    title: "AI, Cloud & Cybersecurity Services in Rwanda",
    description:
      "Expervia helps organisations in Kigali and across Rwanda build secure cloud, AI and data capability on Microsoft and Huawei, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Rwanda",
    intro:
      "Rwanda has made technology central to its national development, and Kigali is building a reputation as a place to launch and scale digital services. Expervia helps Rwandan organisations adopt cloud and AI securely and in line with local data rules.",
    context: [
      {
        title: "Technology-led national strategy",
        body: "Government programmes have put digital services, connectivity and innovation at the heart of the economy.",
      },
      {
        title: "Kigali as a launchpad",
        body: "International organisations and start-ups use Kigali as a regional base, creating demand for well-governed cloud platforms.",
      },
      {
        title: "Clear data rules",
        body: "Rwanda's 2021 personal data protection law sets expectations for where and how personal data is handled.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud architecture that respects data localisation and cross-border transfer rules.",
      },
      {
        key: "ai",
        why: "AI pilots for public services, finance and health, with governance designed in.",
      },
      {
        key: "cybersecurity",
        why: "Security assessments and controls for organisations handling citizen and customer data.",
      },
    ],
    industries: [
      "Government and public services",
      "Financial services",
      "Health",
      "Tourism and hospitality",
      "International organisations",
    ],
    compliance:
      "We design with Rwanda's Law No. 058/2021 on the protection of personal data and privacy in mind, including its rules on storing personal data and transferring it outside Rwanda, overseen by the National Cyber Security Authority.",
    delivery: LAGOS_DELIVERY("in Rwanda", "Kigali"),
    faqs: [
      {
        question: "Do you have staff in Rwanda?",
        answer:
          "We serve Rwandan clients from Lagos, working remotely in Central Africa Time and travelling to Kigali when a project needs on-site work.",
      },
      {
        question: "Can cloud solutions meet Rwanda's data localisation rules?",
        answer:
          "Yes. We design cloud architecture around where data is allowed to be stored and how it can be transferred, and work with you on any approvals the law requires.",
      },
      {
        question: "Do you work in French as well as English?",
        answer:
          "Our core delivery is in English, and we can support French-speaking stakeholders on request.",
      },
    ],
  },
  {
    slug: "south-africa",
    name: "South Africa",
    inName: "in South Africa",
    region: "Southern Africa",
    iso: "ZA",
    hubs: ["Johannesburg", "Cape Town", "Durban"],
    currency: "South African rand (ZAR)",
    timeZone: "South Africa Standard Time (UTC+2)",
    title: "AI, Cloud & Cybersecurity Services in South Africa",
    description:
      "Expervia delivers Microsoft cloud, AI, data and POPIA-aware cybersecurity for organisations in Johannesburg, Cape Town and across South Africa.",
    headline: "AI, Cloud and Cybersecurity for Organisations in South Africa",
    intro:
      "South Africa has the continent's most established enterprise IT market, with local Microsoft Azure regions and demanding customers. Expervia brings specialist Microsoft, AI and security skills to South African organisations that want an extra, cost-effective delivery partner.",
    context: [
      {
        title: "Local hyperscale cloud",
        body: "Azure regions in Johannesburg and Cape Town make it practical to keep data in-country while using the full Microsoft cloud.",
      },
      {
        title: "Mature, regulated sectors",
        body: "Banking, insurance, retail and mining run complex estates that need careful modernisation and strong governance.",
      },
      {
        title: "POPIA in force",
        body: "The Protection of Personal Information Act shapes how every organisation handles customer and employee data.",
      },
    ],
    priorities: [
      {
        key: "microsoft",
        why: "Azure, Microsoft 365, Copilot and Dynamics 365 projects using South African Azure regions.",
      },
      {
        key: "data",
        why: "Microsoft Fabric and Power BI programmes for data-rich enterprises.",
      },
      {
        key: "cybersecurity",
        why: "POPIA-aware security, identity and monitoring for regulated industries.",
      },
    ],
    industries: [
      "Banking and insurance",
      "Retail",
      "Mining",
      "Manufacturing",
      "Public sector",
    ],
    compliance:
      "We design with the Protection of Personal Information Act (POPIA) and the Cybercrimes Act 2020 in mind, and use South African Azure regions where data needs to stay in the country.",
    delivery: LAGOS_DELIVERY("in South Africa", "Johannesburg and Cape Town"),
    faqs: [
      {
        question: "Why work with a Lagos-based partner in South Africa?",
        answer:
          "We bring specialist Microsoft, AI and security skills at a competitive cost, working remotely in South African hours and on site when needed, often alongside your existing providers.",
      },
      {
        question: "Can our data stay in South Africa?",
        answer:
          "Yes. We use Azure's South African regions so data can remain in the country, and design controls with POPIA in mind.",
      },
      {
        question: "Do you deliver Microsoft Fabric and Copilot projects?",
        answer:
          "Yes. Data platforms on Microsoft Fabric and Copilot adoption are among our core Microsoft services.",
      },
    ],
  },
  {
    slug: "uganda",
    name: "Uganda",
    inName: "in Uganda",
    region: "East Africa",
    iso: "UG",
    hubs: ["Kampala", "Entebbe"],
    currency: "Ugandan shilling (UGX)",
    timeZone: "East Africa Time (UTC+3)",
    title: "AI, Cloud & Cybersecurity Services in Uganda",
    description:
      "Expervia helps organisations in Kampala and across Uganda adopt secure cloud, Microsoft 365, AI and data solutions, delivered from Lagos with on-site visits.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Uganda",
    intro:
      "Uganda's banks, telecoms, NGOs and public institutions are investing in digital services and mobile-first customer experiences. Expervia helps them build on secure, well-run cloud and get real value from data and AI.",
    context: [
      {
        title: "Mobile-first customers",
        body: "Mobile money and mobile connectivity drive how Ugandans bank, pay and access services.",
      },
      {
        title: "Strong development sector",
        body: "Kampala hosts many NGOs and international programmes that need secure collaboration and reliable reporting.",
      },
      {
        title: "Data protection law in place",
        body: "The Data Protection and Privacy Act 2019 sets rules for how personal data is collected and secured.",
      },
    ],
    priorities: [
      {
        key: "microsoft",
        why: "Microsoft 365 and secure collaboration for enterprises, NGOs and public bodies.",
      },
      {
        key: "cloud",
        why: "Cloud migration that reduces infrastructure costs and improves resilience.",
      },
      {
        key: "data",
        why: "Reporting and analytics for programmes, finance and operations.",
      },
    ],
    industries: [
      "Banking and mobile money",
      "Telecoms",
      "NGOs and development organisations",
      "Agriculture",
      "Public sector",
    ],
    compliance:
      "We design with Uganda's Data Protection and Privacy Act 2019 and its 2021 regulations in mind, including registration with the Personal Data Protection Office.",
    delivery: LAGOS_DELIVERY("in Uganda", "Kampala"),
    faqs: [
      {
        question: "How do you support Ugandan clients?",
        answer:
          "We deliver from Lagos, working remotely in East Africa Time, and travel to Kampala for on-site workshops and go-lives.",
      },
      {
        question: "Do you work with NGOs in Kampala?",
        answer:
          "Yes. We help NGOs and development programmes with Microsoft 365, secure data sharing and donor reporting.",
      },
      {
        question: "Which Ugandan regulations do you consider?",
        answer:
          "We take the Data Protection and Privacy Act 2019 and its regulations into account, and work with your compliance team on registration and policy.",
      },
    ],
  },
  {
    slug: "tanzania",
    name: "Tanzania",
    inName: "in Tanzania",
    region: "East Africa",
    iso: "TZ",
    hubs: ["Dar es Salaam", "Dodoma", "Arusha"],
    currency: "Tanzanian shilling (TZS)",
    timeZone: "East Africa Time (UTC+3)",
    title: "AI, Cloud & Cybersecurity Services in Tanzania",
    description:
      "Expervia supports organisations in Dar es Salaam and across Tanzania with cloud, Microsoft 365, cybersecurity and data, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Tanzania",
    intro:
      "Tanzania's economy is diversifying, and its banks, telecoms, logistics and public institutions are modernising fast. Expervia helps Tanzanian organisations move to secure cloud and make better use of their data.",
    context: [
      {
        title: "A growing gateway economy",
        body: "The port of Dar es Salaam and regional trade routes make logistics and supply chain systems critical.",
      },
      {
        title: "Digital financial services",
        body: "Mobile money and digital banking keep expanding access, raising the stakes for security and uptime.",
      },
      {
        title: "New data protection law",
        body: "The Personal Data Protection Act 2022 created clear obligations and a regulator for personal data.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud migration and hybrid infrastructure for enterprises and public institutions.",
      },
      {
        key: "cybersecurity",
        why: "Security controls and monitoring aligned to the Personal Data Protection Act 2022.",
      },
      {
        key: "data",
        why: "Analytics for logistics, finance and operations teams.",
      },
    ],
    industries: [
      "Banking and mobile money",
      "Logistics and ports",
      "Telecoms",
      "Mining and energy",
      "Tourism",
    ],
    compliance:
      "We design with Tanzania's Personal Data Protection Act 2022 in mind, including registration with the Personal Data Protection Commission and rules on cross-border transfers.",
    delivery: LAGOS_DELIVERY("in Tanzania", "Dar es Salaam"),
    faqs: [
      {
        question: "Can you support projects in Dar es Salaam?",
        answer:
          "Yes. We work remotely in East Africa Time and travel to Dar es Salaam for on-site work when a project needs it.",
      },
      {
        question: "Do you design for Tanzania's data protection law?",
        answer:
          "Yes. Our cloud, data and security designs take the Personal Data Protection Act 2022 into account, and we work with your team on registration and transfer requirements.",
      },
      {
        question: "Can you work in Swahili?",
        answer:
          "Our delivery language is English. We can involve Swahili-speaking stakeholders through your team where needed.",
      },
    ],
  },
  {
    slug: "egypt",
    name: "Egypt",
    inName: "in Egypt",
    region: "North Africa",
    iso: "EG",
    hubs: ["Cairo", "Alexandria"],
    currency: "Egyptian pound (EGP)",
    timeZone: "Eastern European Time (UTC+2)",
    title: "AI, Cloud & Cybersecurity Services in Egypt",
    description:
      "Expervia helps organisations in Cairo and across Egypt adopt Microsoft and Huawei cloud, AI, data and cybersecurity, delivered from Lagos with on-site visits.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Egypt",
    intro:
      "Egypt combines a large domestic market with a deep technology talent pool and ambitious digital government plans. Expervia brings Microsoft and Huawei expertise to Egyptian organisations building cloud, AI and data platforms.",
    context: [
      {
        title: "Digital government at scale",
        body: "National digital transformation programmes are moving public services and payments online.",
      },
      {
        title: "Strong outsourcing and tech base",
        body: "Cairo is a major technology and outsourcing hub, with sophisticated buyers of cloud and AI services.",
      },
      {
        title: "Personal data law",
        body: "Egypt's Personal Data Protection Law of 2020 introduces licensing and strict rules on cross-border data transfers.",
      },
    ],
    priorities: [
      {
        key: "ai",
        why: "AI and analytics for large enterprises, telecoms and public bodies.",
      },
      {
        key: "cloud",
        why: "Huawei Cloud and Azure architectures that respect local data transfer rules.",
      },
      {
        key: "cybersecurity",
        why: "Security operations and identity for high-volume digital services.",
      },
    ],
    industries: [
      "Government and public sector",
      "Telecoms",
      "Banking and fintech",
      "Manufacturing",
      "Tourism",
    ],
    compliance:
      "We design with Egypt's Personal Data Protection Law No. 151 of 2020 and its rules on licensing and cross-border transfers in mind, alongside Central Bank of Egypt requirements for financial institutions.",
    delivery: LAGOS_DELIVERY("in Egypt", "Cairo"),
    faqs: [
      {
        question: "Do you have a team in Egypt?",
        answer:
          "We serve Egyptian clients from Lagos, working remotely in Egypt's business hours and travelling to Cairo for on-site work when a project needs it.",
      },
      {
        question: "Can you deliver Huawei Cloud projects in Egypt?",
        answer:
          "Yes. As a Huawei Enterprise Partner we design and deliver Huawei Cloud and infrastructure projects as well as Microsoft Azure.",
      },
      {
        question: "Do you design for Egypt's data protection law?",
        answer:
          "Yes. We take Law No. 151 of 2020 into account, especially for cross-border data transfers, and work with your legal team on licensing questions.",
      },
    ],
  },
  {
    slug: "cote-divoire",
    name: "Côte d'Ivoire",
    inName: "in Côte d'Ivoire",
    region: "West Africa",
    iso: "CI",
    hubs: ["Abidjan", "Yamoussoukro"],
    currency: "West African CFA franc (XOF)",
    timeZone: "Greenwich Mean Time (UTC+0)",
    frSlug: "cote-divoire",
    title: "AI, Cloud & Cybersecurity Services in Côte d'Ivoire",
    description:
      "Expervia helps organisations in Abidjan and across Côte d'Ivoire adopt secure cloud, AI and data on Microsoft and Huawei, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Côte d'Ivoire",
    intro:
      "Côte d'Ivoire is one of West Africa's fastest-growing economies and Abidjan is a financial and business hub for French-speaking Africa. Expervia helps Ivorian organisations modernise with secure cloud, data and AI.",
    context: [
      {
        title: "Francophone West Africa's hub",
        body: "Abidjan hosts regional headquarters for banks, telecoms and international companies across the UEMOA zone.",
      },
      {
        title: "Fast digital adoption",
        body: "Mobile money and digital banking are expanding quickly, raising expectations for secure, always-on services.",
      },
      {
        title: "Data protection since 2013",
        body: "Ivorian law has regulated personal data since 2013, overseen by the telecoms regulator ARTCI.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud migration for banks, telecoms and enterprises serving the UEMOA region.",
      },
      {
        key: "cybersecurity",
        why: "Security and data protection controls aligned with Ivorian law and BCEAO expectations.",
      },
      {
        key: "data",
        why: "Analytics and reporting for regional operations.",
      },
    ],
    industries: [
      "Banking and microfinance",
      "Telecoms",
      "Agribusiness (cocoa, coffee)",
      "Energy",
      "Public sector",
    ],
    compliance:
      "We design with Côte d'Ivoire's Law No. 2013-450 on personal data protection in mind, including declarations and authorisations with ARTCI, and BCEAO requirements for financial institutions.",
    delivery: LAGOS_DELIVERY("in Côte d'Ivoire", "Abidjan"),
    faqs: [
      {
        question: "Do you work in French in Côte d'Ivoire?",
        answer:
          "Yes. We support French-speaking stakeholders, and this page is also available in French.",
      },
      {
        question: "How do you deliver projects in Abidjan?",
        answer:
          "We work remotely from Lagos (one hour ahead) and travel to Abidjan for workshops, go-lives and on-site work.",
      },
      {
        question: "Which regulations do you consider?",
        answer:
          "We take Law No. 2013-450 on personal data protection and BCEAO rules for financial institutions into account, working with your compliance team.",
      },
    ],
  },
  {
    slug: "senegal",
    name: "Senegal",
    inName: "in Senegal",
    region: "West Africa",
    iso: "SN",
    hubs: ["Dakar", "Diamniadio"],
    currency: "West African CFA franc (XOF)",
    timeZone: "Greenwich Mean Time (UTC+0)",
    frSlug: "senegal",
    title: "AI, Cloud & Cybersecurity Services in Senegal",
    description:
      "Expervia supports organisations in Dakar and across Senegal with secure cloud, Microsoft 365, AI and data solutions, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Senegal",
    intro:
      "Senegal has positioned Dakar as a digital hub for West Africa, with strong connectivity and a growing start-up scene. Expervia helps Senegalese organisations build secure cloud foundations and practical AI.",
    context: [
      {
        title: "A regional digital hub",
        body: "Investment in connectivity, data centres and the Diamniadio area supports Dakar's role as a digital centre.",
      },
      {
        title: "Growing start-up ecosystem",
        body: "Fintech and digital service start-ups are growing alongside established banks and telecoms.",
      },
      {
        title: "Long-standing data protection",
        body: "Senegal has regulated personal data since 2008, with the CDP as its data protection authority.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud and hybrid infrastructure for enterprises and public institutions.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365 and secure collaboration for French- and English-speaking teams.",
      },
      {
        key: "cybersecurity",
        why: "Security controls aligned with CDP and BCEAO expectations.",
      },
    ],
    industries: [
      "Banking and fintech",
      "Telecoms",
      "Public sector",
      "Fisheries and agriculture",
      "Energy",
    ],
    compliance:
      "We design with Senegal's Law No. 2008-12 on personal data protection in mind, including declarations to the Commission de Protection des Données Personnelles (CDP), and BCEAO rules for financial institutions.",
    delivery: LAGOS_DELIVERY("in Senegal", "Dakar"),
    faqs: [
      {
        question: "Can you support French-speaking teams in Dakar?",
        answer:
          "Yes. We support French-speaking stakeholders, and this page is also available in French.",
      },
      {
        question: "How do you deliver in Senegal?",
        answer:
          "We work remotely from Lagos and travel to Dakar for on-site workshops, go-lives and support.",
      },
      {
        question: "Do you consider Senegal's data protection law?",
        answer:
          "Yes. We take Law No. 2008-12 and CDP requirements into account and work with your team on declarations.",
      },
    ],
  },
  {
    slug: "cameroon",
    name: "Cameroon",
    inName: "in Cameroon",
    region: "Central Africa",
    iso: "CM",
    hubs: ["Douala", "Yaoundé"],
    currency: "Central African CFA franc (XAF)",
    timeZone: "West Africa Time (UTC+1)",
    frSlug: "cameroun",
    title: "AI, Cloud & Cybersecurity Services in Cameroon",
    description:
      "Expervia helps organisations in Douala, Yaoundé and across Cameroon adopt secure cloud, AI and data, in English or French, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Cameroon",
    intro:
      "Cameroon is Central Africa's largest economy and officially bilingual, with Douala as its business capital and Yaoundé as its seat of government. Expervia supports Cameroonian organisations in English and French.",
    context: [
      {
        title: "Central Africa's economic engine",
        body: "Douala's port and businesses serve markets across the CEMAC region.",
      },
      {
        title: "Bilingual by design",
        body: "Teams often work in both French and English, so solutions and training need to work in both.",
      },
      {
        title: "Same time zone as Lagos",
        body: "Cameroon shares West Africa Time with Nigeria, which makes day-to-day collaboration easy.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Cloud and hybrid infrastructure that improves resilience and reduces costs.",
      },
      {
        key: "cybersecurity",
        why: "Security controls aligned with Cameroon's cybersecurity and data protection laws.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365 and collaboration for bilingual organisations.",
      },
    ],
    industries: [
      "Banking and microfinance",
      "Telecoms",
      "Logistics and ports",
      "Agriculture and forestry",
      "Public sector",
    ],
    compliance:
      "We design with Cameroon's 2010 law on cybersecurity and cybercrime and its 2024 personal data protection law in mind, along with COBAC expectations for financial institutions.",
    delivery: LAGOS_DELIVERY("in Cameroon", "Douala and Yaoundé"),
    faqs: [
      {
        question: "Do you work in both English and French?",
        answer:
          "Yes. Cameroon is bilingual, and we support teams in both languages. This page is also available in French.",
      },
      {
        question: "How close is Cameroon to your Lagos team?",
        answer:
          "Very close: we share the same time zone, and Douala is a short flight from Lagos for on-site work.",
      },
      {
        question: "Which industries do you support in Cameroon?",
        answer:
          "Banking, telecoms, logistics, agriculture and the public sector, among others.",
      },
    ],
  },
  {
    slug: "morocco",
    name: "Morocco",
    inName: "in Morocco",
    region: "North Africa",
    iso: "MA",
    hubs: ["Casablanca", "Rabat", "Tangier"],
    currency: "Moroccan dirham (MAD)",
    timeZone: "Morocco Standard Time (UTC+1)",
    frSlug: "maroc",
    title: "AI, Cloud & Cybersecurity Services in Morocco",
    description:
      "Expervia supports organisations in Casablanca, Rabat and across Morocco with secure cloud, AI, data and Microsoft solutions, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in Morocco",
    intro:
      "Morocco is a gateway between Africa and Europe, with Casablanca Finance City and a strong industrial base. Expervia helps Moroccan organisations, and those expanding into the rest of Africa, build secure cloud, data and AI capability.",
    context: [
      {
        title: "Gateway to Africa",
        body: "Many Moroccan banks, insurers and telecoms operate across Sub-Saharan Africa and need platforms that work across borders.",
      },
      {
        title: "Industrial and automotive base",
        body: "Manufacturing around Tangier and Kenitra drives demand for data, IoT and analytics.",
      },
      {
        title: "Mature data protection",
        body: "Law 09-08 and the CNDP have regulated personal data for more than a decade.",
      },
    ],
    priorities: [
      {
        key: "data",
        why: "Analytics and data platforms for banks, insurers and manufacturers.",
      },
      {
        key: "cloud",
        why: "Cloud architecture that respects CNDP rules on data transfers.",
      },
      {
        key: "ai",
        why: "AI and automation for customer service and operations.",
      },
    ],
    industries: [
      "Banking and insurance",
      "Automotive and manufacturing",
      "Telecoms",
      "Tourism",
      "Public sector",
    ],
    compliance:
      "We design with Morocco's Law 09-08 on personal data protection in mind, including declarations and transfer authorisations with the CNDP, and Bank Al-Maghrib requirements for financial institutions.",
    delivery: LAGOS_DELIVERY("in Morocco", "Casablanca and Rabat"),
    faqs: [
      {
        question: "Do you support French-speaking teams in Morocco?",
        answer:
          "Yes. We support French-speaking stakeholders, and this page is also available in French.",
      },
      {
        question:
          "Can you help Moroccan companies expanding into Sub-Saharan Africa?",
        answer:
          "Yes. From Lagos we understand West African markets well and can help design platforms that work across your African operations.",
      },
      {
        question: "Do you consider CNDP rules on data transfers?",
        answer:
          "Yes. We take Law 09-08 and CNDP transfer rules into account when designing cloud and data solutions.",
      },
    ],
  },
  {
    slug: "dr-congo",
    name: "DR Congo",
    inName: "in the DRC",
    region: "Central Africa",
    iso: "CD",
    hubs: ["Kinshasa", "Lubumbashi"],
    currency: "Congolese franc (CDF)",
    timeZone: "West Africa Time (UTC+1) in Kinshasa",
    frSlug: "rdc",
    title: "AI, Cloud & Cybersecurity Services in DR Congo",
    description:
      "Expervia helps organisations in Kinshasa, Lubumbashi and across the DRC build secure cloud, Microsoft 365 and data capability, delivered from Lagos.",
    headline: "AI, Cloud and Cybersecurity for Organisations in DR Congo",
    intro:
      "The Democratic Republic of the Congo is one of Africa's largest markets, with major mining, telecoms and banking sectors and a fast-growing digital economy. Expervia helps Congolese organisations build reliable, secure IT foundations.",
    context: [
      {
        title: "Resource-driven economy",
        body: "Mining in the south and growing services in Kinshasa create demand for reliable operational and reporting systems.",
      },
      {
        title: "Connectivity is improving",
        body: "Expanding mobile and fibre networks are opening the way to cloud services and digital banking.",
      },
      {
        title: "A new digital code",
        body: "The DRC's 2023 Digital Code sets rules for electronic transactions, cybersecurity and personal data.",
      },
    ],
    priorities: [
      {
        key: "cloud",
        why: "Hybrid and cloud infrastructure designed for variable connectivity and resilience.",
      },
      {
        key: "microsoft",
        why: "Microsoft 365 and secure collaboration for distributed teams and sites.",
      },
      {
        key: "cybersecurity",
        why: "Security foundations for banks, telecoms and mining operators.",
      },
    ],
    industries: [
      "Mining",
      "Telecoms",
      "Banking",
      "NGOs and humanitarian organisations",
      "Public sector",
    ],
    compliance:
      "We design with the DRC's 2023 Digital Code (Code du numérique) in mind, including its provisions on cybersecurity and personal data, working with your legal advisers on the details.",
    delivery: LAGOS_DELIVERY("in the DRC", "Kinshasa and Lubumbashi"),
    faqs: [
      {
        question: "Do you work in French in the DRC?",
        answer:
          "Yes. We support French-speaking stakeholders, and this page is also available in French.",
      },
      {
        question: "Can you design for unreliable connectivity?",
        answer:
          "Yes. We design hybrid and offline-tolerant architectures for sites where connectivity varies, such as mines and remote offices.",
      },
      {
        question: "How do you deliver projects in Kinshasa?",
        answer:
          "We work remotely from Lagos (same time zone as Kinshasa) and travel for on-site work when a project needs it.",
      },
    ],
  },
];

export function getCountry(slug: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}
