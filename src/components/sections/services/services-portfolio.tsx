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
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

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
      "Resilient, elastic environments, migrated securely and engineered to scale with your business in real time.",
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
      "Beyond the code: reimagining business models, experiences, and ways of working for a digital-first economy.",
    capabilities: [
      "Strategic 3 to 5 year roadmap",
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
      "The foundational stack engineered for high-scale African operations: networking, compute, and continuity.",
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
      "We run the complexity for you: proactive operations and DevOps with strict, measurable SLAs.",
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
    <Section id="portfolio" labelledBy="portfolio-heading" tone="lavender">
      <SectionIntro
        id="portfolio-heading"
        eyebrow="The Portfolio"
        title="Eight Disciplines, One Integrated Partner"
        center
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2">
        {services.map(
          ({ icon, title, description, capabilities, benefit, href }, i) => {
            const body = (
              <>
                <span
                  aria-hidden
                  className="from-brand-900 via-brand-600 to-brand-300 absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100"
                />
                <div className="flex items-start justify-between gap-4">
                  <IconBadge icon={icon} />
                  <span
                    aria-hidden
                    className="font-jakarta text-brand-200 text-3xl font-extrabold"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-jakarta text-brand-950 mt-5 text-xl font-bold">
                  {title}
                </h3>
                <p className="text-ink/75 mt-2.5 leading-relaxed">
                  {description}
                </p>
                <ul className="border-brand-100 mt-5 space-y-2.5 border-t pt-5">
                  {capabilities.map((c) => (
                    <li
                      key={c}
                      className="text-ink/80 flex items-start gap-2.5 text-[0.95rem]"
                    >
                      <Check
                        aria-hidden
                        className="text-brand-600 mt-0.5 size-4 shrink-0"
                      />
                      {c}
                    </li>
                  ))}
                </ul>
                <div aria-hidden className="flex-1" />
                <div className="bg-lavender mt-6 rounded-2xl p-5">
                  <p className="text-brand-600 text-xs font-bold tracking-[0.18em] uppercase">
                    Business Benefit
                  </p>
                  <p className="text-ink/80 mt-1.5 text-sm leading-relaxed">
                    {benefit}
                  </p>
                </div>
                {href && (
                  <span className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                    Explore {title}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                )}
              </>
            );
            const className =
              "group border-brand-100 hover:border-brand-300 focus-visible:ring-brand-400 relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(33,0,93,0.45)] focus-visible:ring-2 focus-visible:outline-none sm:p-9";
            return (
              <li key={title}>
                {href ? (
                  <Link href={href} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            );
          },
        )}
      </ul>
    </Section>
  );
}
