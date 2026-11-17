import {
  ShieldCheck,
  Eye,
  Fingerprint,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

const stack: { icon: LucideIcon; name: string; body: string }[] = [
  {
    icon: ShieldCheck,
    name: "Microsoft Defender XDR",
    body: "Unified protection across endpoints, email, identities, and cloud apps.",
  },
  {
    icon: Eye,
    name: "Microsoft Sentinel",
    body: "Cloud-native SIEM and SOAR for intelligent detection and automated response.",
  },
  {
    icon: Fingerprint,
    name: "Microsoft Entra",
    body: "Zero-Trust identity, conditional access, and privileged-access management.",
  },
  {
    icon: FileCheck2,
    name: "Microsoft Purview",
    body: "Data governance, DLP, and compliance for regulated, sovereign data.",
  },
];

export function CyberStack() {
  return (
    <Section id="stack" labelledBy="stack-heading" tone="lavender">
      <SectionIntro
        id="stack-heading"
        eyebrow="Technology Expertise"
        title="The Security Stack We Master"
        intro="As a Microsoft AI Cloud Partner, we run an enterprise-grade security platform: integrated, intelligent, and built for African compliance."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stack.map(({ icon, name, body }) => (
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
