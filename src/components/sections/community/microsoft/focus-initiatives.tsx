import { Bot, ShieldCheck, type LucideIcon } from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const initiatives: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Bot,
    title: "AI & Copilot Adoption",
    body: "Leading the wave of generative AI implementation across African enterprise sectors using Azure OpenAI and Microsoft 365 Copilot.",
  },
  {
    icon: ShieldCheck,
    title: "Security & Identity",
    body: "Hardening infrastructure through Zero Trust architectures and advanced Entra ID implementations for highly regulated industries.",
  },
];

export function FocusInitiatives() {
  return (
    <Section id="initiatives" labelledBy="initiatives-heading" tone="indigo">
      <SectionIntro
        id="initiatives-heading"
        eyebrow="Focus Initiatives"
        title="Where We're Driving Impact"
        center
        dark
      />
      <ul className="mt-14 grid gap-5 lg:grid-cols-2">
        {initiatives.map(({ icon, title, body }) => (
          <li
            key={title}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08] md:p-10"
          >
            <IconBadge icon={icon} dark />
            <h3 className="font-jakarta mt-5 text-2xl font-bold text-white">
              {title}
            </h3>
            <p className="text-brand-100/80 mt-2.5 text-lg leading-relaxed">
              {body}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
