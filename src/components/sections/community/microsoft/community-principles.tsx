import {
  Award,
  Handshake,
  Star,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const principles: { icon: LucideIcon; title: string }[] = [
  { icon: Award, title: "Professionalism" },
  { icon: Handshake, title: "Collaboration" },
  { icon: Star, title: "Excellence" },
  { icon: ShieldCheck, title: "Integrity" },
];

export function CommunityPrinciples() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">Community Principles</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            What We Stand For
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-2 lg:grid-cols-4">
          {principles.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="border-outline-variant/20 flex flex-col items-center gap-3 rounded-xl border p-8 text-center"
            >
              <Icon className="text-primary size-8" />
              <span className="font-display text-on-surface font-semibold">
                {title}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
