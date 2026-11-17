import { BadgeCheck } from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";

const partners = [
  "Microsoft AI Cloud Partner",
  "Microsoft Cloud Solutions Partner",
  "Huawei Enterprise Partner",
  "VMware Cloud Verified",
];

export function ServicesPartners() {
  return (
    <Section id="partners" labelledBy="services-partners-heading">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <SectionIntro
          id="services-partners-heading"
          eyebrow="Ecosystem"
          title="Strategic Ecosystem Partners"
          intro="We maintain deep technical solution stacks with global leaders, so our clients receive the most robust, vetted and supported technology on the market."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {partners.map((p) => (
            <li
              key={p}
              className="bg-lavender text-brand-950 flex items-center gap-3 rounded-2xl px-5 py-4 font-semibold"
            >
              <BadgeCheck
                aria-hidden
                className="text-brand-600 size-5 shrink-0"
              />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
