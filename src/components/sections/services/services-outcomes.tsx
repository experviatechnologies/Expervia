import {
  TrendingUp,
  Heart,
  ShieldCheck,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const stats: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: TrendingUp, value: "40%", label: "Productivity Gains" },
  { icon: Heart, value: "2.5x", label: "Customer NPS" },
  { icon: ShieldCheck, value: "Zero", label: "Critical Breaches" },
  { icon: PiggyBank, value: "60%", label: "OpEx Reduction" },
];

export function ServicesOutcomes() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 max-w-3xl">
          <SectionLabel className="mb-4">Why Expervia</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Technology Alone Doesn&apos;t Create Transformation
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            True evolution happens at the intersection of robust infrastructure
            and human-centric design. Every engagement is measured by the
            tangible business outcomes it delivers — not the tools we deploy.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="glass-card rounded-2xl p-8 text-center sm:text-left"
            >
              <Icon className="text-primary mx-auto mb-6 size-8 sm:mx-0" />
              <div className="font-display text-on-surface mb-1 text-4xl font-extrabold sm:text-5xl">
                {value}
              </div>
              <div className="text-on-surface-variant text-sm">{label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
