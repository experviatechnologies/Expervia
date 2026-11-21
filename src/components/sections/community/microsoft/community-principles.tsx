import {
  Award,
  Handshake,
  Star,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const principles: { icon: LucideIcon; title: string }[] = [
  { icon: Award, title: "Professionalism" },
  { icon: Handshake, title: "Collaboration" },
  { icon: Star, title: "Excellence" },
  { icon: ShieldCheck, title: "Integrity" },
];

export function CommunityPrinciples() {
  return (
    <Section id="principles" labelledBy="principles-heading" tone="lavender">
      <SectionIntro
        id="principles-heading"
        eyebrow="Community Principles"
        title="What We Stand For"
        center
      />
      <ul className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {principles.map(({ icon, title }) => (
          <li
            key={title}
            className="border-brand-100 flex flex-col items-center gap-4 rounded-3xl border bg-white p-7 text-center"
          >
            <IconBadge icon={icon} />
            <span className="font-jakarta text-brand-950 text-lg font-bold">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
