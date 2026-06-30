import Link from "next/link";
import {
  BrainCircuit,
  CloudCheck,
  ShieldCheck,
  BarChart3,
  LayoutGrid,
  Repeat,
  Server,
  Headset,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";
import { cn } from "@/lib/utils";

type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
  capabilities: string[];
  benefit: string;
  href?: string;
};

const services: Service[] = [
  {
    icon: BrainCircuit,
    title: "Artificial Intelligence",
    description:
      "Generative and predictive AI that automates complex workflows and surfaces hidden intelligence in your proprietary data.",
    capabilities: [
      "Custom LLM training & fine-tuning",
      "AI strategy & governance frameworks",
      "Intelligent process automation",
    ],
    benefit:
      "Accelerate decision-making and free high-value talent to focus on innovation.",
    href: "/solutions/ai",
  },
  {
    icon: CloudCheck,
    title: "Cloud Services",
    description:
      "Resilient, elastic environments — migrated securely and engineered to scale with your business in real time.",
    capabilities: [
      "Hybrid & multi-cloud architecture",
      "Low-risk workload migration",
      "Cloud-native app modernization",
    ],
    benefit:
      "Reduce CapEx and reach 99.99% availability through automated scaling and healing.",
    href: "/solutions/cloud",
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity",
    description:
      "A Zero-Trust architecture that assumes breach, verifies every request, and is watched by a managed SOC around the clock.",
    capabilities: [
      "Zero-Trust & identity protection",
      "24/7 managed detection & response",
      "Governance, risk & NDPR compliance",
    ],
    benefit:
      "Protect your brand and avoid regulatory fines while keeping access seamless.",
    href: "/solutions/cybersecurity",
  },
  {
    icon: BarChart3,
    title: "Data & Analytics",
    description:
      "Raw telemetry transformed into a governed source of truth and predictive insight that drives growth.",
    capabilities: [
      "Modern data platform & lakehouse",
      "Self-service BI & dashboards",
      "Advanced & predictive analytics",
    ],
    benefit:
      "Move from reactive reporting to anticipating market shifts before they occur.",
    href: "/solutions/data",
  },
  {
    icon: LayoutGrid,
    title: "Microsoft Solutions",
    description:
      "As a Microsoft AI Cloud Partner, we deliver the full depth of the Microsoft stack with enterprise-grade security.",
    capabilities: [
      "Azure AI & Azure OpenAI Service",
      "Modern Workplace (M365 + Copilot)",
      "Dynamics 365 CRM & ERP",
    ],
    benefit:
      "Seamless integration across your software estate under one security perimeter.",
    href: "/solutions/microsoft",
  },
  {
    icon: Repeat,
    title: "Digital Transformation",
    description:
      "Beyond the code — reimagining business models, experiences, and ways of working for a digital-first economy.",
    capabilities: [
      "Strategic 3–5 year roadmap",
      "UX/UI innovation & rapid prototyping",
      "Change management & upskilling",
    ],
    benefit:
      "Future-proof your organization and create new digital revenue streams.",
  },
  {
    icon: Server,
    title: "Enterprise Infrastructure",
    description:
      "The foundational stack engineered for high-scale African operations — networking, compute, and continuity.",
    capabilities: [
      "SD-WAN & high-performance networking",
      "HCI & virtualization",
      "Disaster recovery (DRaaS)",
    ],
    benefit:
      "A robust, resilient foundation so your team can focus on the core mission.",
  },
  {
    icon: Headset,
    title: "Managed Services",
    description:
      "We run the complexity for you — proactive operations and DevOps with strict, measurable SLAs.",
    capabilities: [
      "24/7 managed operations & SLAs",
      "Proactive monitoring & patching",
      "DevOps as a service (CI/CD, IaC)",
    ],
    benefit:
      "Top-tier expertise and modern tooling without the cost of hiring in-house.",
  },
];

export function ServicesPortfolio() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">The Portfolio</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Eight Disciplines, One Integrated Partner
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2">
          {services.map(
            (
              { icon: Icon, title, description, capabilities, benefit, href },
              i,
            ) => {
              const body = (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex size-12 items-center justify-center rounded-lg transition-colors">
                      <Icon className="size-6" />
                    </div>
                    <span className="font-display text-primary/20 text-4xl font-extrabold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                    {title}
                  </h3>
                  <p className="text-on-surface-variant mb-6">{description}</p>

                  <ul className="mb-6 space-y-2">
                    {capabilities.map((c) => (
                      <li
                        key={c}
                        className="text-on-surface-variant flex items-start gap-2 text-sm"
                      >
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto border-t border-white/5 pt-6">
                    <span className="text-label-sm text-on-surface/50 mb-1 block font-mono uppercase">
                      Business Benefit
                    </span>
                    <p className="text-on-surface-variant text-sm">{benefit}</p>
                    {href && (
                      <span className="text-primary mt-4 inline-flex items-center gap-2 font-bold group-hover:gap-3">
                        Explore {title}
                        <ArrowRight className="size-4 transition-all" />
                      </span>
                    )}
                  </div>
                </>
              );

              const className = cn(
                "glass-card group flex h-full flex-col rounded-2xl p-8 transition-all",
                href ? "hover:border-primary/50" : "border-white/5",
              );

              return href ? (
                <Link key={title} href={href} className={className}>
                  {body}
                </Link>
              ) : (
                <div key={title} className={className}>
                  {body}
                </div>
              );
            },
          )}
        </div>
      </Container>
    </section>
  );
}
