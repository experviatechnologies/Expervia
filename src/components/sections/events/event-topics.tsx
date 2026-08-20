import {
  Cloud,
  BrainCircuit,
  ShieldCheck,
  LayoutGrid,
  BarChart3,
  Boxes,
  Rocket,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const topics: { icon: LucideIcon; label: string }[] = [
  { icon: Cloud, label: "Microsoft Azure" },
  { icon: BrainCircuit, label: "AI & Copilot" },
  { icon: ShieldCheck, label: "Cybersecurity" },
  { icon: LayoutGrid, label: "Microsoft 365" },
  { icon: BarChart3, label: "Data & Analytics" },
  { icon: Boxes, label: "Business Applications" },
  { icon: Rocket, label: "Digital Transformation" },
  { icon: Compass, label: "Technology Leadership" },
];

export function EventTopics() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">What We Cover</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Every Session, Grounded in Real Technology
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto max-w-2xl">
            From cloud architecture to AI adoption and security governance, ETEN
            events span the technologies driving the modern African enterprise.
          </p>
        </div>

        <div className="gap-gutter grid grid-cols-2 md:grid-cols-4">
          {topics.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass-card hover:border-primary/50 flex flex-col items-center gap-4 rounded-2xl p-8 text-center transition-all"
            >
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-6" />
              </div>
              <span className="text-on-surface text-body-md font-semibold">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
