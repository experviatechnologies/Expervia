import {
  BrainCircuit,
  CloudCheck,
  ShieldCheck,
  Repeat,
  Check,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

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
    <Section id="expertise" labelledBy="expertise-heading" tone="lavender">
      <SectionIntro
        id="expertise-heading"
        eyebrow="What we do"
        title="Core Areas of Expertise"
        intro="Our multidisciplinary approach ensures holistic digital resilience and growth."
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2">
        {areas.map(({ icon, title, points }, i) => (
          <li
            key={title}
            className="group border-brand-100 hover:border-brand-300 relative overflow-hidden rounded-3xl border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(33,0,93,0.45)] sm:p-9"
          >
            <span
              aria-hidden
              className="from-brand-900 via-brand-600 to-brand-300 absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100"
            />
            <div className="flex items-start justify-between gap-4">
              <IconBadge icon={icon} />
              <span
                aria-hidden
                className="font-jakarta text-brand-200 text-sm font-bold"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-jakarta text-brand-950 mt-5 text-xl font-bold">
              {title}
            </h3>
            <ul className="border-brand-100 mt-5 space-y-2.5 border-t pt-5">
              {points.map((point) => (
                <li
                  key={point}
                  className="text-ink/80 flex items-start gap-2.5"
                >
                  <Check
                    aria-hidden
                    className="text-brand-600 mt-1 size-4 shrink-0"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
