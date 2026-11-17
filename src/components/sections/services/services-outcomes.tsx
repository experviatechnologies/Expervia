import {
  TrendingUp,
  Heart,
  ShieldCheck,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const stats: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: TrendingUp, value: "40%", label: "Productivity Gains" },
  { icon: Heart, value: "2.5x", label: "Customer NPS" },
  { icon: ShieldCheck, value: "Zero", label: "Critical Breaches" },
  { icon: PiggyBank, value: "60%", label: "OpEx Reduction" },
];

export function ServicesOutcomes() {
  return (
    <Section id="outcomes" labelledBy="outcomes-heading">
      <SectionIntro
        id="outcomes-heading"
        eyebrow="Why Expervia"
        title="Technology Alone Doesn't Create Transformation"
        intro="True evolution happens at the intersection of robust infrastructure and human-centric design. Every engagement is measured by the tangible business outcomes it delivers, not the tools we deploy."
      />
      <ul className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {stats.map(({ icon, value, label }) => (
          <li
            key={label}
            className="border-brand-100 rounded-3xl border bg-white p-6 shadow-[0_24px_50px_-34px_rgba(33,0,93,0.45)] sm:p-8"
          >
            <IconBadge icon={icon} />
            <p className="font-jakarta text-brand-700 mt-6 text-4xl font-extrabold sm:text-5xl">
              {value}
            </p>
            <p className="text-ink/70 mt-1 text-sm font-medium">{label}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
