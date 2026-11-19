import {
  TrendingUp,
  Briefcase,
  Users,
  GraduationCap,
  Eye,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

const advantages: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: TrendingUp,
    title: "Income Growth",
    body: "Direct access to premium enterprise fee structures and bonuses.",
  },
  {
    icon: Briefcase,
    title: "Enterprise Tenders",
    body: "Participate in large-scale government and private sector projects.",
  },
  {
    icon: Users,
    title: "Consulting Hub",
    body: "Lead strategic advisory sessions for C-level executives across Africa.",
  },
  {
    icon: GraduationCap,
    title: "Masterclass Roles",
    body: "Get paid for delivery of Huawei specialized training assignments.",
  },
  {
    icon: Eye,
    title: "Global Visibility",
    body: "Be featured as an elite professional in our ecosystem showcase.",
  },
];

export function ProfessionalAdvantage() {
  return (
    <Section id="advantage" labelledBy="advantage-heading" tone="lavender">
      <SectionIntro
        id="advantage-heading"
        eyebrow="The Professional Advantage"
        title="What Membership Unlocks"
        center
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {advantages.map(({ icon, title, body }) => (
          <li key={title} className={cardClass}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {title}
            </h3>
            <p className="text-ink/75 mt-2 text-sm leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
