import { ScanEye, Lock, Scale, UserCheck, type LucideIcon } from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const principles: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ScanEye,
    title: "Transparency & Explainability",
    body: "Models you can interpret, audit, and trust. No black boxes in production.",
  },
  {
    icon: Lock,
    title: "Data Security & Privacy",
    body: "Your data stays yours, with Zero-Trust controls and regional residency.",
  },
  {
    icon: Scale,
    title: "Fairness & Bias Controls",
    body: "Continuous evaluation to detect and mitigate bias before it reaches users.",
  },
  {
    icon: UserCheck,
    title: "Human Oversight",
    body: "Humans-in-the-loop and clear guardrails for every high-stakes decision.",
  },
];

export function ResponsibleAi() {
  return (
    <Section id="responsible-ai" labelledBy="rai-heading" tone="indigo">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <SectionIntro
          id="rai-heading"
          eyebrow="Responsible AI"
          title="Powerful AI, Built on Trust"
          intro="Enterprise AI only delivers when it's safe, compliant, and accountable. We engineer governance in from day one."
          dark
        />
        <ul className="grid gap-5 sm:grid-cols-2">
          {principles.map(({ icon, title, body }) => (
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
