import Image from "next/image";
import {
  CloudUpload,
  Network,
  Container as ContainerIcon,
  ServerCog,
  ShieldCheck,
  PiggyBank,
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
    name: "Cloud Strategy & Migration",
    icon: CloudUpload,
    eyebrow: "Zero-downtime cutovers",
    description:
      "Assess, plan, and execute seamless migrations — rehost, replatform, or refactor — onto secure, well-governed landing zones.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["Azure Migrate", "Landing Zones", "Modernization"],
  },
  {
    name: "Hybrid & Multi-Cloud",
    icon: Network,
    description:
      "Unify workloads across Azure, Huawei Cloud, and on-prem with consistent governance and identity.",
    span: "lg:col-span-1",
  },
  {
    name: "Cloud-Native & Kubernetes",
    icon: ContainerIcon,
    description:
      "Containerize and modernize applications with AKS, microservices, and automated CI/CD.",
    span: "lg:col-span-1",
  },
  {
    name: "Managed Cloud Operations",
    icon: ServerCog,
    description:
      "24/7 monitoring, patching, and SRE practices that keep your platform fast and always-on.",
    span: "lg:col-span-1",
  },
  {
    name: "Cloud Security & Compliance",
    icon: ShieldCheck,
    description:
      "Zero-Trust architecture, identity, and compliance baked into every landing zone.",
    span: "lg:col-span-1",
  },
  {
    name: "FinOps & Cost Optimization",
    icon: PiggyBank,
    eyebrow: "Eliminate waste",
    description:
      "Continuous cost visibility, rightsizing, and reserved-capacity strategy so you only pay for what you use.",
    span: "lg:col-span-3",
  },
];

export function CloudCapabilities() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">What We Deliver</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            End-to-End Cloud Capabilities
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
                {/* Background image slot (featured card only). Swap in
                    /public/images/cloud-migration.jpg and update `src`. */}
                {featured && (
                  <div className="absolute inset-0">
                    <Image
                      src="/images/cloud-migration.svg"
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 66vw, 100vw"
                      className="object-cover opacity-25"
                    />
                    <div className="from-surface-container/90 absolute inset-0 bg-gradient-to-t to-transparent" />
                  </div>
                )}

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
