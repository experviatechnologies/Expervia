import {
  ShieldCheck,
  HeartPulse,
  ScrollText,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Zero-Trust Security",
    body: "Identity-first access, encryption, and least-privilege by default.",
  },
  {
    icon: HeartPulse,
    title: "High Availability & DR",
    body: "Multi-zone resilience and tested disaster-recovery runbooks.",
  },
  {
    icon: ScrollText,
    title: "Compliance & Sovereignty",
    body: "Regional data residency aligned to ISO, SOC 2, and local regulation.",
  },
  {
    icon: Activity,
    title: "Full Observability",
    body: "End-to-end monitoring, tracing, and alerting across every workload.",
  },
];

export function CloudResilience() {
  return (
    <Section id="resilience" labelledBy="resilience-heading" tone="indigo">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <SectionIntro
          id="resilience-heading"
          eyebrow="Secure & Resilient"
          title="Built to Stay Secure and Always-On"
          intro="Resilience and security aren't add-ons. We engineer them into every landing zone, so your platform is trusted from day one."
          dark
        />
        <ul className="grid gap-5 sm:grid-cols-2">
          {pillars.map(({ icon, title, body }) => (
            <li
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08]"
            >
              <IconBadge icon={icon} dark />
              <h3 className="font-jakarta mt-5 text-lg font-bold text-white">
                {title}
              </h3>
              <p className="text-brand-100/80 mt-1.5 leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
