import {
  TrendingUp,
  Users,
  Eye,
  GraduationCap,
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
    title: "Income Growth & Enterprise Opportunities",
    body: "Access large-scale enterprise deployments and revenue-generating engagements that you may not get alone.",
  },
  {
    icon: Users,
    title: "Consulting & Training",
    body: "Participate in high-level consulting engagements and specialized training assignments for global partners.",
  },
  {
    icon: Eye,
    title: "Professional Visibility",
    body: "Increase your market presence through the Expervia ecosystem and gain direct visibility with regional leaders.",
  },
  {
    icon: GraduationCap,
    title: "Career & Certification Growth",
    body: "Collaborate with certified peers and Microsoft MVPs to accelerate your technical mastery and certification path.",
  },
];

export function ProfessionalAdvantages() {
  return (
    <Section id="advantages" labelledBy="empc-adv-heading">
      <SectionIntro
        id="empc-adv-heading"
        eyebrow="The Professional Advantage"
        title="What Membership Unlocks"
        center
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {advantages.map(({ icon, title, body }) => (
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
