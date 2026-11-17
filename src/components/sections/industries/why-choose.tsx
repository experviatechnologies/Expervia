import {
  BadgeCheck,
  Network,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const reasons: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BadgeCheck,
    title: "Microsoft AI Cloud Partner",
    body: "Expertise in the full Microsoft stack, from Azure to M365 and specialized AI integrations.",
  },
  {
    icon: Network,
    title: "Strategic Partnerships",
    body: "Microsoft Cloud Solutions Partner and Huawei Enterprise Partner, offering a diverse and resilient technology ecosystem.",
  },
  {
    icon: ShieldCheck,
    title: "Security-First Methodology",
    body: "Every solution we deploy is built on a foundation of Zero-Trust and proactive risk management.",
  },
];

export function WhyChoose() {
  return (
    <Section id="why-choose" labelledBy="why-choose-heading" tone="indigo">
      <SectionIntro
        id="why-choose-heading"
        eyebrow="Why Expervia"
        title={
          <>
            Why Global Leaders{" "}
            <span className="text-brand-200">Choose Expervia</span>
          </>
        }
        dark
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-3">
        {reasons.map(({ icon, title, body }) => (
          <li
            key={title}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08]"
          >
            <IconBadge icon={icon} dark />
            <h3 className="font-jakarta mt-5 text-xl font-bold text-white">
              {title}
            </h3>
            <p className="text-brand-100/80 mt-2 leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
