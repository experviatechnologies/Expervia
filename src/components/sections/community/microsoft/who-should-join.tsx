import {
  Cloud,
  Users,
  Lock,
  BarChart3,
  Briefcase,
  Code,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const areas: { icon: LucideIcon; title: string }[] = [
  { icon: Cloud, title: "Cloud Infrastructure" },
  { icon: Users, title: "Modern Work" },
  { icon: Lock, title: "Security & Compliance" },
  { icon: BarChart3, title: "Data & AI" },
  { icon: Briefcase, title: "Business Apps" },
  { icon: Code, title: "Developers" },
  { icon: UserCheck, title: "Consultants" },
];

export function WhoShouldJoin() {
  return (
    <Section id="who-should-join" labelledBy="empc-who-heading" tone="lavender">
      <SectionIntro
        id="empc-who-heading"
        eyebrow="Who Should Join?"
        title="Seven Specialization Areas"
        center
      />
      <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {areas.map(({ icon, title }) => (
          <li
            key={title}
            className="border-brand-100 hover:border-brand-300 flex items-center gap-4 rounded-2xl border bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-24px_rgba(33,0,93,0.35)]"
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
