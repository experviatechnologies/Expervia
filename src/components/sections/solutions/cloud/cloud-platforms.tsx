import { Cloud, Server, Network, Layers, type LucideIcon } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const platforms: { icon: LucideIcon; name: string; body: string }[] = [
  {
    icon: Cloud,
    name: "Microsoft Azure",
    body: "Full-stack Azure: IaaS, PaaS, AKS, and Azure AI services.",
  },
  {
    icon: Server,
    name: "Huawei Cloud",
    body: "Cloud Stack, OceanStor storage, and intelligent networking.",
  },
  {
    icon: Network,
    name: "Hybrid & Private",
    body: "Seamless on-prem to cloud with Azure Arc and Azure Stack.",
  },
  {
    icon: Layers,
    name: "Multi-Cloud",
    body: "Vendor-neutral architecture and governance across providers.",
  },
];

export function CloudPlatforms() {
  return (
    <section className="bg-surface-container-lowest py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-4">Platform Expertise</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Platforms We Master
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            Certified depth across the platforms that matter — so we recommend
            the best fit for your business, not a vendor&apos;s quota.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map(({ icon: Icon, name, body }) => (
            <div
              key={name}
              className="bg-surface-container hover:border-primary/40 rounded-xl border border-white/5 p-8 transition-colors"
            >
              <Icon className="text-primary mb-6 size-8" />
              <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                {name}
              </h3>
              <p className="text-on-surface-variant text-sm">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
