import {
  BookOpen,
  HeartHandshake,
  Network,
  Megaphone,
  Crown,
  Users,
  DoorOpen,
  ShieldCheck,
  BrainCircuit,
  Cloud,
  Code2,
  BarChart3,
  Palette,
  ClipboardList,
  Workflow,
  Rocket,
  GraduationCap,
  Compass,
  Sprout,
  Briefcase,
  Lightbulb,
  Star,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

type Item = { icon: LucideIcon; title: string; description: string };

const benefits: Item[] = [
  {
    icon: BookOpen,
    title: "Practical Learning",
    description:
      "Build real, job-relevant skills through sessions, workshops and shared resources.",
  },
  {
    icon: HeartHandshake,
    title: "Mentorship and Guidance",
    description:
      "Learn from experienced women and practitioners who have walked the path.",
  },
  {
    icon: Network,
    title: "Professional Network",
    description:
      "Form lasting relationships with peers, role models and industry professionals.",
  },
  {
    icon: Megaphone,
    title: "Visibility",
    description:
      "Share your work and ideas, and get recognised for what you bring to technology.",
  },
  {
    icon: Crown,
    title: "Leadership Development",
    description:
      "Grow the confidence and capability to lead teams, projects and conversations.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "Work with other members on ideas, projects and community initiatives.",
  },
  {
    icon: DoorOpen,
    title: "Access to Opportunities",
    description:
      "Hear about learning, career and collaboration opportunities as they become available.",
  },
  {
    icon: Sprout,
    title: "A Supportive Space",
    description:
      "An inclusive, encouraging community where every stage of the journey is respected.",
  },
];

const focusAreas: { icon: LucideIcon; title: string }[] = [
  { icon: BrainCircuit, title: "Artificial Intelligence" },
  { icon: BarChart3, title: "Data and Analytics" },
  { icon: ShieldCheck, title: "Cybersecurity" },
  { icon: Cloud, title: "Cloud Computing" },
  { icon: Code2, title: "Software Engineering" },
  { icon: Palette, title: "Product and UX Design" },
  { icon: ClipboardList, title: "Product and Project Management" },
  { icon: Workflow, title: "Digital Transformation" },
  { icon: Rocket, title: "Entrepreneurship and Innovation" },
  { icon: Crown, title: "Technology Leadership" },
];

const audiences: Item[] = [
  {
    icon: GraduationCap,
    title: "Students and Undergraduates",
    description:
      "Explore technology pathways, meet role models and start learning early.",
  },
  {
    icon: Compass,
    title: "Beginners and Career Explorers",
    description:
      "Curious about tech? No advanced technical background is required to join.",
  },
  {
    icon: Sprout,
    title: "Emerging Professionals",
    description:
      "Build skills, confidence, your network and a clear career direction.",
  },
  {
    icon: Briefcase,
    title: "Experienced Professionals",
    description:
      "Share your expertise, grow your visibility and support the next generation.",
  },
  {
    icon: Lightbulb,
    title: "Entrepreneurs and Innovators",
    description:
      "Connect with peers, test ideas and explore collaboration and partnerships.",
  },
  {
    icon: Star,
    title: "Technology Leaders and Experts",
    description:
      "Help develop talent and take part in shaping the community as a leader.",
  },
];

export function WitWhyJoin() {
  const [featured, ...rest] = benefits;
  return (
    <Section id="why-join" labelledBy="wit-why-heading">
      <SectionIntro
        id="wit-why-heading"
        eyebrow="Why Join"
        title="Your Growth Deserves the Right Support System."
        intro="Everything in ETEN Women in Tech is built around helping you learn, connect and move forward with confidence."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li className="bg-brand-900 relative overflow-hidden rounded-3xl p-7 text-white shadow-[0_24px_50px_-28px_rgba(33,0,93,0.8)] sm:col-span-2 lg:p-9">
          <div
            aria-hidden
            className="bg-brand-600/40 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
          />
          <IconBadge icon={featured.icon} dark />
          <h3 className="font-jakarta mt-6 text-2xl font-bold sm:text-3xl">
            {featured.title}
          </h3>
          <p className="text-brand-100/90 mt-4 max-w-md text-lg leading-relaxed">
            {featured.description}
          </p>
        </li>
        {rest.map(({ icon, title, description }) => (
          <li key={title} className={cardClass}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {title}
            </h3>
            <p className="text-ink/75 mt-2.5 leading-relaxed">{description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function WitFocusAreas() {
  return (
    <Section id="focus-areas" labelledBy="wit-focus-heading" tone="lavender">
      <SectionIntro
        id="wit-focus-heading"
        eyebrow="Focus Areas"
        title="Find Your Place in the Technology Ecosystem."
        intro="Technology is far bigger than code. Our community spans the technical, product, business and leadership disciplines that shape it."
      />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {focusAreas.map(({ icon, title }) => (
          <li
            key={title}
            className="border-brand-100 hover:border-brand-300 flex items-center gap-4 rounded-2xl border bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-24px_rgba(33,0,93,0.35)] lg:flex-col lg:items-start"
          >
            <IconBadge icon={icon} className="size-11" />
            <span className="font-jakarta text-brand-950 font-bold">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function WitWhoShouldJoin() {
  return (
    <Section id="who-should-join" labelledBy="wit-who-heading">
      <SectionIntro
        id="wit-who-heading"
        eyebrow="Who Should Join"
        title="There Is a Place for You Here."
        intro="Wherever you are in your technology journey, you belong in this community."
        center
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {audiences.map(({ icon, title, description }) => (
          <li key={title} className={cardClass}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {title}
            </h3>
            <p className="text-ink/75 mt-2.5 leading-relaxed">{description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
