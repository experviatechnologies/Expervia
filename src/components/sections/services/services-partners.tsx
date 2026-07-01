import { CloudCheck, BadgeCheck, Network, Layers } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const partners = [
  { icon: CloudCheck, label: "Microsoft AI Cloud Partner" },
  { icon: BadgeCheck, label: "Microsoft Cloud Solutions Partner" },
  { icon: Network, label: "Huawei Enterprise Partner" },
  { icon: Layers, label: "VMware Cloud Verified" },
];

export function ServicesPartners() {
  return (
    <section className="bg-surface-container-lowest py-section">
      <Container>
        <div className="mb-12 max-w-2xl">
          <SectionLabel className="mb-4">Ecosystem</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Strategic Ecosystem Partners
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            We maintain deep technical solution stacks with global leaders — so
            our clients receive the most robust, vetted, and supported
            technology on the market.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-2 lg:grid-cols-4">
          {partners.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="bg-surface-container hover:border-primary/40 flex flex-col items-center gap-4 rounded-xl border border-white/5 p-8 text-center transition-colors"
            >
              <Icon className="text-primary size-9" />
              <span className="text-label-sm font-mono font-bold tracking-widest uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
