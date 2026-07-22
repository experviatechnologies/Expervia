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
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">Who Should Join?</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Seven Specialization Areas
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {areas.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="border-outline-variant/20 hover:border-primary/50 bg-surface-container-low flex items-center gap-4 rounded-xl border p-6 transition-colors"
            >
              <Icon className="text-primary size-6 shrink-0" />
              <span className="font-bold">{title}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
