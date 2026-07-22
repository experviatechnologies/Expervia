import {
  TrendingUp,
  Briefcase,
  Users,
  GraduationCap,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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

        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
