import {
  GraduationCap,
  Wrench,
  Users,
  Compass,
  RefreshCw,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

const benefits: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: GraduationCap,
    title: "Learn From Practitioners",
    body: "Sessions led by engineers and architects who ship real systems, not theory decks.",
  },
  {
    icon: Wrench,
    title: "Practical Knowledge",
    body: "Hands-on workshops and live demos you can put to work the very next morning.",
  },
  {
    icon: Users,
    title: "Build Your Network",
    body: "Connect with peers, mentors, and hiring teams across the African tech ecosystem.",
  },
  {
    icon: Compass,
    title: "Discover Opportunities",
    body: "Surface roles, projects, and partnerships opening up inside the network.",
  },
  {
    icon: RefreshCw,
    title: "Stay Current",
    body: "Keep pace with Microsoft, cloud, AI, and security as the landscape evolves.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Career",
    body: "Turn your certifications into commercial momentum, visibility, and reputation.",
  },
];

export function WhyAttend() {
  return (
    <Section id="why-attend" labelledBy="why-attend-heading" tone="lavender">
      <SectionIntro
        id="why-attend-heading"
        eyebrow="More Than Just Another Webinar"
        title="Where Technology Professionals Connect and Grow"
        center
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map(({ icon, title, body }) => (
          <li key={title} className={cardClass}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {title}
            </h3>
            <p className="text-ink/75 mt-2.5 leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
