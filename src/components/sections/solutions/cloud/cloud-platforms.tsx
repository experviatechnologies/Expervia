import { Cloud, Server, Network, Layers, type LucideIcon } from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

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
    <Section id="platforms" labelledBy="platforms-heading" tone="lavender">
      <SectionIntro
        id="platforms-heading"
        eyebrow="Platform Expertise"
        title="Platforms We Master"
        intro="Certified depth across the platforms that matter, so we recommend the best fit for your business, not a vendor's quota."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map(({ icon, name, body }) => (
          <li key={name} className={cardClass}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {name}
            </h3>
            <p className="text-ink/75 mt-2.5 leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
