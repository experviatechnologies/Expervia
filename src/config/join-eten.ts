/**
 * Content for the Join ETEN landing page (/join-eten), taken word for word
 * from the approved design (join_eten/ export, Nov 2026). Edit copy here.
 */
import {
  Award,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  Briefcase,
  Cloud,
  CodeXml,
  Crown,
  Database,
  GraduationCap,
  Handshake,
  Layers,
  LayoutGrid,
  Lightbulb,
  Megaphone,
  MessagesSquare,
  Network,
  Presentation,
  Rocket,
  School,
  ShieldCheck,
  Sprout,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type Card = { icon: LucideIcon; title: string; description: string };

export const etenSubnav = [
  { id: "about", label: "About ETEN" },
  { id: "benefits", label: "Member Benefits" },
  { id: "communities", label: "Technology Communities" },
  { id: "leadership", label: "Leadership Opportunities" },
  { id: "how-to-join", label: "How to Join" },
  { id: "faqs", label: "FAQs" },
] as const;

export const heroDomains: { icon: LucideIcon; label: string }[] = [
  { icon: Cloud, label: "Cloud" },
  { icon: BrainCircuit, label: "AI" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Database, label: "Data" },
  { icon: CodeXml, label: "Software" },
  { icon: LayoutGrid, label: "Microsoft" },
];

/** The first benefit is shown as the large featured (indigo) card. */
export const benefits: Card[] = [
  {
    icon: Network,
    title: "Professional Networking",
    description:
      "Connect with technology professionals, engineers, architects, developers, consultants and industry experts across different specialisations and geographical locations.",
  },
  {
    icon: Layers,
    title: "Technical Communities and Pods",
    description:
      "Join specialist communities built around your areas of expertise and interests. Engage in technical discussions, exchange ideas and learn from professionals working in your field.",
  },
  {
    icon: Presentation,
    title: "Knowledge Sharing and Webinars",
    description:
      "Participate in technical webinars, expert-led sessions, workshops and knowledge-sharing activities designed to strengthen your professional knowledge.",
  },
  {
    icon: Handshake,
    title: "Projects and Collaboration",
    description:
      "Discover opportunities to collaborate with other professionals, contribute to practical technology projects and work with teams across different technical disciplines.",
  },
  {
    icon: Sprout,
    title: "Mentorship and Professional Development",
    description:
      "Learn from experienced professionals, share your expertise and support the development of emerging technology talents.",
  },
  {
    icon: Briefcase,
    title: "Career and Professional Opportunities",
    description:
      "Expand your professional network, improve your industry visibility and connect with potential collaborators, project teams and technology opportunities.",
  },
  {
    icon: Crown,
    title: "Leadership and Community Participation",
    description:
      "Take an active role in building specialist communities, organising activities, leading discussions and supporting the growth of the ETEN ecosystem.",
  },
];

export const communities: {
  icon: LucideIcon;
  title: string;
  items: string[];
}[] = [
  {
    icon: Cloud,
    title: "Cloud Computing and Infrastructure",
    items: [
      "Microsoft Azure",
      "Amazon Web Services (AWS)",
      "Google Cloud Platform",
      "Cloud Architecture and Infrastructure Management",
    ],
  },
  {
    icon: LayoutGrid,
    title: "Microsoft Technologies",
    items: [
      "Microsoft 365",
      "Dynamics 365",
      "Power Platform",
      "Microsoft Copilot and AI Solutions",
    ],
  },
  {
    icon: BrainCircuit,
    title: "Artificial Intelligence and Emerging Technologies",
    items: [
      "Artificial Intelligence",
      "Generative AI",
      "Machine Learning",
      "AI Engineering and Automation",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity and Information Protection",
    items: [
      "Cloud Security",
      "Cybersecurity Engineering",
      "Identity and Access Management",
      "Governance, Risk and Compliance",
    ],
  },
  {
    icon: Database,
    title: "Data and Analytics",
    items: [
      "Data Engineering",
      "Data Analytics",
      "Business Intelligence",
      "Data Science",
    ],
  },
  {
    icon: CodeXml,
    title: "Software Engineering and Development",
    items: [
      "Frontend and Backend Development",
      "Mobile Application Development",
      "DevOps and Platform Engineering",
      "Software Architecture",
    ],
  },
];

export const audiences: Card[] = [
  {
    icon: UserRoundCheck,
    title: "Technology Professionals",
    description:
      "Experienced engineers, developers, cloud architects, cybersecurity specialists, data analysts, consultants and technology practitioners.",
  },
  {
    icon: GraduationCap,
    title: "Emerging Technology Talents",
    description:
      "Students, graduates, aspiring professionals and individuals developing careers in technology.",
  },
  {
    icon: BookOpenText,
    title: "Technology Trainers and Instructors",
    description:
      "Certified trainers, educators, technical instructors and professionals passionate about knowledge sharing.",
  },
  {
    icon: Award,
    title: "Technology Leaders and Industry Experts",
    description:
      "Technology executives, solution architects, technical leads, consultants and specialists interested in contributing to the wider technology ecosystem.",
  },
  {
    icon: Rocket,
    title: "Technology Entrepreneurs and Innovators",
    description:
      "Founders, builders and innovators interested in collaborating, developing solutions and connecting with technical talent.",
  },
];

export const leadershipRoles: Card[] = [
  {
    icon: Users,
    title: "Community Leaders",
    description: "Lead and coordinate specialist technology communities.",
  },
  {
    icon: MessagesSquare,
    title: "Technical Contributors",
    description:
      "Share knowledge, write technical content and participate in discussions.",
  },
  {
    icon: Sprout,
    title: "Trainers and Mentors",
    description:
      "Support learning initiatives and mentor emerging professionals.",
  },
  {
    icon: Megaphone,
    title: "Community Ambassadors",
    description: "Promote ETEN and introduce new professionals to the network.",
  },
  {
    icon: Lightbulb,
    title: "Project Contributors",
    description: "Collaborate on practical projects and technical initiatives.",
  },
  {
    icon: School,
    title: "University and Student Engagement",
    description:
      "Help connect ETEN with university departments, technology clubs and student communities.",
  },
];

export const joinSteps = [
  {
    title: "Complete Your Registration",
    body: "Submit your membership application through the ETEN registration form.",
  },
  {
    title: "Complete Your Member Verification",
    body: "Provide the required information and complete the onboarding and verification process.",
  },
  {
    title: "Join Your Technology Communities",
    body: "Connect with relevant specialist communities and Pods aligned with your interests and expertise.",
  },
  {
    title: "Start Connecting and Contributing",
    body: "Participate in discussions, webinars, knowledge-sharing activities, projects and other community initiatives.",
  },
];

export const partnerships = [
  "Microsoft AI Cloud Partner",
  "Microsoft Solutions Partner",
  "Microsoft Cloud Solution Provider",
  "Huawei Enterprise Partner",
  "Anthropic Partner in Africa",
  "AWS Partner in Africa",
  "Google Cloud Partner in Africa",
];
export const PartnerIcon = BadgeCheck;

export const etenFaqs = [
  {
    question: "What is ETEN?",
    answer:
      "ETEN stands for Expervia Technologies Expert Network. It is a professional network that connects technology experts, practitioners, emerging talents and industry professionals for collaboration, knowledge sharing and professional development.",
  },
  {
    question: "Who can join ETEN?",
    answer:
      "Technology professionals, software developers, engineers, cloud specialists, cybersecurity experts, data professionals, students, graduates, trainers and technology enthusiasts can apply to join.",
  },
  {
    question: "Do I need to be an experienced technology professional to join?",
    answer:
      "No. ETEN welcomes both experienced professionals and individuals who are developing their careers in technology.",
  },
  {
    question: "Can students join ETEN?",
    answer:
      "Yes. University students, especially those studying Computer Science, Computer Engineering, Software Engineering, Information Technology and related disciplines, are encouraged to join.",
  },
  {
    question: "Are there opportunities to lead a community or technology Pod?",
    answer:
      "Yes. Members can express interest in community leadership, technical coordination, mentorship, knowledge sharing and other community development activities.",
  },
  {
    question: "Will I have opportunities to participate in projects?",
    answer:
      "ETEN provides opportunities for members to connect and collaborate on relevant technology projects and initiatives, depending on available opportunities and project requirements.",
  },
  {
    question: "How do I become a member?",
    answer:
      "Simply complete the registration form using the Join ETEN button on this page. You will receive further information about the onboarding process.",
  },
  {
    question: "Is ETEN only for professionals in Nigeria?",
    answer:
      "No. ETEN is designed to connect technology professionals across Africa and beyond.",
  },
];

export const finalCtaPoints = [
  "Connect with experts.",
  "Share your knowledge.",
  "Collaborate on projects.",
  "Develop your skills.",
  "Help shape the future of technology.",
];
