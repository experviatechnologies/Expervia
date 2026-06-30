import {
  Radar,
  Fingerprint,
  CloudCog,
  Bug,
  Lock,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";
import { cn } from "@/lib/utils";

type Capability = {
  name: string;
  icon: LucideIcon;
  description: string;
  span: string;
  eyebrow?: string;
  featured?: boolean;
  tags?: string[];
};

const capabilities: Capability[] = [
  {
    name: "Managed Detection & Response",
    icon: Radar,
    eyebrow: "24/7 SOC",
    description:
      "A managed Security Operations Center that monitors, hunts, and responds to threats in real time — so an attack is contained before it becomes a breach.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["SIEM", "Threat Hunting", "Incident Response"],
  },
  {
    name: "Identity & Access Management",
    icon: Fingerprint,
    description:
      "Zero-Trust identity with MFA, conditional access, and least-privilege across every user and device.",
    span: "lg:col-span-1",
  },
  {
    name: "Cloud & Infrastructure Security",
    icon: CloudCog,
    description:
      "Harden Azure, Huawei Cloud, and hybrid estates with posture management and continuous protection.",
    span: "lg:col-span-1",
  },
  {
    name: "Threat & Vulnerability Management",
    icon: Bug,
    description:
      "Penetration testing, vulnerability scanning, and remediation that close gaps before attackers find them.",
    span: "lg:col-span-1",
  },
  {
    name: "Data Protection & Compliance",
    icon: Lock,
    description:
      "Encryption, DLP, and governance aligned to ISO 27001, SOC 2, and Nigeria's NDPR.",
    span: "lg:col-span-1",
  },
  {
    name: "Security Awareness & Governance",
    icon: GraduationCap,
    eyebrow: "Your people, hardened",
    description:
      "Phishing simulations, staff training, and GRC programs that turn your workforce into a resilient first line of defense.",
    span: "lg:col-span-3",
  },
];

export function CyberCapabilities() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">What We Deliver</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            End-to-End Security Capabilities
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(
            ({
              name,
              icon: Icon,
              description,
              span,
              eyebrow,
              featured,
              tags,
            }) => (
              <article
                key={name}
                className={cn(
                  "glass-card hover:border-primary/50 relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all",
                  span,
                  featured &&
                    "from-primary/10 bg-gradient-to-br to-transparent",
                )}
              >
                <div className="relative z-10 flex grow flex-col">
                  <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
                    <Icon className="size-6" />
                  </div>
                  {eyebrow && (
                    <span className="text-label-sm text-primary mb-2 font-mono tracking-wider uppercase">
                      {eyebrow}
                    </span>
                  )}
                  <h3
                    className={cn(
                      "font-display text-on-surface mb-2 font-semibold",
                      featured ? "text-headline-lg" : "text-headline-md",
                    )}
                  >
                    {name}
                  </h3>
                  <p className="text-on-surface-variant max-w-md">
                    {description}
                  </p>

                  {tags && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      </Container>
    </section>
  );
}
