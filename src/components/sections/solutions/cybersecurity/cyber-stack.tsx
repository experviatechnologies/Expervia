import {
  ShieldCheck,
  Eye,
  Fingerprint,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface-container-lowest py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-4">Technology Expertise</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            The Security Stack We Master
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            As a Microsoft AI Cloud Partner, we run an enterprise-grade security
            platform — integrated, intelligent, and built for African
            compliance.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map(({ icon: Icon, name, body }) => (
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
