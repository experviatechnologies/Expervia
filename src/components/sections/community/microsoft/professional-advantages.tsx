import {
  TrendingUp,
  Users,
  Eye,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">
            The Professional Advantage
          </SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            What Membership Unlocks
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-surface-container hover:border-primary/40 space-y-4 rounded-xl border border-white/5 p-8 transition-colors"
            >
              <Icon className="text-primary size-8" />
              <h3 className="font-display text-on-surface text-headline-md font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant text-sm">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
