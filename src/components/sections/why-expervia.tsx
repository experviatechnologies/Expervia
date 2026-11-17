import {
  Check,
  ShieldCheck,
  Handshake,
  Users,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";
import { cn } from "@/lib/utils";

const reasons = [
  {
    title: "Direct Partnership Status",
    description:
      "Direct access to Microsoft and Huawei engineering resources, ensuring priority support and early access to innovations.",
  },
  {
    title: "Security-First Methodology",
    description:
      "Every line of code and architectural design is vetted through our Zero-Trust framework before deployment.",
  },
  {
    title: "Local Execution, Global Standards",
    description:
      "We combine global ITIL/ISO standards with on-the-ground presence in Lagos to handle your most complex challenges.",
  },
];

const metrics: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: ShieldCheck, value: "99.9%", label: "Uptime SLA Guaranteed" },
  { icon: Handshake, value: "Platinum", label: "Tier Partner Status" },
  { icon: Users, value: "200+", label: "Certified Experts" },
  { icon: Globe, value: "5+", label: "Countries Served" },
];

export function WhyExpervia() {
  return (
    <Section id="why-expervia" labelledBy="why-heading" tone="indigo">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionIntro
            id="why-heading"
            eyebrow="Why Expervia"
            title={
              <>
                The Partner for{" "}
                <span className="text-brand-200">
                  High-Stakes Digital Transformation.
                </span>
              </>
            }
            dark
          />
          <ul className="mt-10 space-y-6">
            {reasons.map((r) => (
              <li key={r.title} className="flex gap-4">
                <span className="bg-brand-600/50 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-white/15">
                  <Check aria-hidden className="text-brand-100 size-4" />
                </span>
                <div>
                  <h3 className="font-jakarta text-lg font-bold text-white">
                    {r.title}
                  </h3>
                  <p className="text-brand-100/80 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ul className="grid grid-cols-2 gap-4">
          {metrics.map(({ icon: Icon, value, label }, i) => (
            <li
              key={label}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur",
                i === 1 && "sm:mt-12",
                i === 2 && "sm:-mt-12",
              )}
            >
              <Icon aria-hidden className="text-brand-200 mb-4 size-9" />
              <p className="font-jakarta text-2xl font-extrabold text-white sm:text-3xl">
                {value}
              </p>
              <p className="text-brand-100/75 mt-2 text-sm">{label}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
