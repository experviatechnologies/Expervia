import {
  Landmark,
  Factory,
  Zap,
  Truck,
  Building2,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";

const industries: { icon: LucideIcon; label: string }[] = [
  { icon: Landmark, label: "Financial Services" },
  { icon: Factory, label: "Manufacturing" },
  { icon: Zap, label: "Energy & Utilities" },
  { icon: Truck, label: "Logistics" },
  { icon: Building2, label: "Public Sector" },
  { icon: Stethoscope, label: "Healthcare" },
];

const reasons = [
  {
    title: "Deep Local Context",
    body: "We understand the unique connectivity and regulatory landscape of the African market.",
  },
  {
    title: "Vendor Neutrality",
    body: "We choose the best-fit technology for your specific business case, not the vendor's quota.",
  },
  {
    title: "Elite Technical Talent",
    body: "Our engineers hold top-tier certifications across AI, Cyber, and Cloud disciplines.",
  },
];

export function IndustriesWhy() {
  return (
    <Section id="industries-why" labelledBy="empower-heading" tone="indigo">
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionIntro
            id="empower-heading"
            eyebrow="Where we work"
            title="Industries We Empower"
            dark
          />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {industries.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 font-semibold backdrop-blur"
              >
                <Icon aria-hidden className="text-brand-200 size-6 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionIntro
            id="why-expervia-heading"
            eyebrow="Our difference"
            title="Why Expervia?"
            dark
          />
          <ol className="mt-10 space-y-7">
            {reasons.map((r, i) => (
              <li key={r.title} className="flex gap-5">
                <span className="font-jakarta text-brand-950 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-lg font-extrabold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-jakarta text-xl font-bold text-white">
                    {r.title}
                  </h3>
                  <p className="text-brand-100/80 mt-1.5 leading-relaxed">
                    {r.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
