/**
 * Content for the ETEN Women in Tech landing page (/women-in-tech).
 *
 * Everything the community team is likely to update (programmes and their
 * status, focus areas, FAQs, contributor roles) lives here, so the page can be
 * kept current without touching layout code (PRD FR-09).
 *
 * Publishing rules from the PRD:
 * - Programmes stay "proposed" or "upcoming" until a date is confirmed. Only
 *   set `status: "confirmed"` (and a `date`) once the community team approves.
 * - No member counts, testimonials, partner logos, fees or job guarantees.
 */

/** Community slug passed to /join so the signup records the interest. */
export const WIT_COMMUNITY_SLUG = "women-in-tech";
export const WIT_JOIN_HREF = `/join?community=${WIT_COMMUNITY_SLUG}`;
export const WIT_PATH = "/women-in-tech";

export const witSections = [
  { id: "about", label: "About" },
  { id: "why-join", label: "Why Join" },
  { id: "focus-areas", label: "Focus Areas" },
  { id: "who-should-join", label: "Who Should Join" },
  { id: "programmes", label: "Programmes" },
  { id: "contribute", label: "Contribute" },
  { id: "faqs", label: "FAQs" },
] as const;

export type ProgrammeStatus = "proposed" | "upcoming" | "confirmed";

export type Programme = {
  title: string;
  description: string;
  status: ProgrammeStatus;
  /** Only shown when status is "confirmed". */
  date?: string;
};

export const witProgrammes: Programme[] = [
  {
    title: "Women in Tech Conversations",
    description:
      "Interviews and open conversations with women building careers across technology.",
    status: "upcoming",
  },
  {
    title: "Her Tech Journey",
    description:
      "Career stories and lessons from women at different stages of their technology journeys.",
    status: "upcoming",
  },
  {
    title: "MentorHer",
    description:
      "A planned mentorship initiative offering professional guidance from experienced practitioners.",
    status: "proposed",
  },
  {
    title: "Women Building with AI",
    description:
      "Practical sessions on using and building with artificial intelligence, from first steps to real projects.",
    status: "upcoming",
  },
  {
    title: "Technical Workshops",
    description:
      "Hands-on sessions across technology disciplines, designed for learning by doing.",
    status: "proposed",
  },
  {
    title: "Career and Industry Webinars",
    description:
      "Discussions on career growth, industry trends and navigating the technology workplace.",
    status: "proposed",
  },
  {
    title: "Women in Tech Summit",
    description:
      "A planned flagship gathering for learning, networking and celebrating women in technology.",
    status: "proposed",
  },
  {
    title: "University Outreach",
    description:
      "An initiative to engage female students and university communities and open doors into technology.",
    status: "proposed",
  },
];

export const witFaqs: { question: string; answer: string }[] = [
  {
    question: "Who can join ETEN Women in Tech?",
    answer:
      "Women at any stage of their technology journey: students and undergraduates, career explorers, emerging and experienced professionals, entrepreneurs, innovators and technology leaders.",
  },
  {
    question: "Do I need a technical background to join?",
    answer:
      "No. You do not need an advanced technical background. The community welcomes women who are curious about technology as well as those already working in it.",
  },
  {
    question: "Is the community only for software developers?",
    answer:
      "Not at all. ETEN Women in Tech covers the wider technology ecosystem, including AI and data, cybersecurity, cloud, product and design, project management, digital transformation, entrepreneurship and leadership.",
  },
  {
    question: "How do I join?",
    answer:
      "Select Join ETEN Women in Tech on this page to create your ETEN account. Your interest in Women in Tech is recorded with your registration, and onboarding continues through the standard ETEN process.",
  },
  {
    question: "How is Women in Tech related to ETEN and Expervia?",
    answer:
      "ETEN Women in Tech is a women-focused community within the Expervia Technologies Expert Network (ETEN), an initiative by Expervia Technologies.",
  },
  {
    question: "Are the programmes already running?",
    answer:
      "The programmes on this page are proposed or upcoming. Confirmed dates and details will be shared with members and published here once they are scheduled.",
  },
  {
    question: "How can I become a mentor, speaker or contributor?",
    answer:
      "Use the contributor form on this page. It is an expression of interest: the ETEN team reviews each submission and follows up about suitable ways to get involved.",
  },
  {
    question: "Where is the community based?",
    answer:
      "The community is growing across Nigeria and Africa, and welcomes women from other regions as membership arrangements allow.",
  },
];

/** Options for the contributor enquiry form (PRD 10.3). */
export const witContributionInterests = [
  "Mentor",
  "Speaker",
  "Community leader",
  "Technical contributor",
  "Partnership contributor",
  "Ambassador",
] as const;
