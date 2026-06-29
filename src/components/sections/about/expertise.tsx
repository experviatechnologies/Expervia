import {
  BrainCircuit,
  CloudCheck,
  ShieldCheck,
  Repeat,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";

const areas: { icon: LucideIcon; title: string; points: string[] }[] = [
  {
    icon: BrainCircuit,
    title: "Artificial Intelligence",
    points: [
      "Enterprise LLM & Generative AI Implementation",
      "Predictive Analytics & Machine Learning Models",
      "AI Strategy & Governance Frameworks",
    ],
  },
  {
    icon: CloudCheck,
    title: "Cloud Transformation",
    points: [
      "Hybrid & Multi-Cloud Architecture",
      "Migration & Legacy Modernization",
      "Managed Cloud Services & Optimization",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity",
    points: [
      "Zero-Trust Security Frameworks",
      "Managed Threat Detection & Response",
      "Regulatory Compliance & Audit Readiness",
    ],
  },
  {
    icon: Repeat,
    title: "Digital Transformation",
    points: [
      "Application Modernization & Microservices",
      "Business Process Automation (BPA)",
      "Customer Experience (CX) Orchestration",
    ],
  },
];

export function Expertise() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16">
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Core Areas of Expertise
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Our multidisciplinary approach ensures holistic digital resilience
            and growth.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2">
          {areas.map(({ icon: Icon, title, points }) => (
            <div key={title} className="glass-card space-y-4 rounded-2xl p-10">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-7" />
              </div>
              <h3 className="font-display text-on-surface text-headline-md font-semibold">
                {title}
              </h3>
              <ul className="text-on-surface-variant space-y-2">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CircleCheck className="text-primary mt-1 size-4 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
