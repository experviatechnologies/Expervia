import Link from "next/link";
import {
  BrainCircuit,
  CloudCheck,
  ShieldCheck,
  Repeat,
  Server,
  LayoutGrid,
  Headset,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

type Solution = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
};

// `href` links a solution to its dedicated page (added as each page is built).
const solutions: Solution[] = [
  {
    icon: BrainCircuit,
    title: "Artificial Intelligence",
    description:
      "Harnessing generative and predictive AI to drive enterprise efficiency and innovation.",
    href: "/solutions/ai",
  },
  {
    icon: CloudCheck,
    title: "Cloud Computing",
    description:
      "Scalable hybrid and multi-cloud strategies powered by Microsoft Azure and Huawei Cloud.",
    href: "/solutions/cloud",
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity",
    description:
      "Security-first architecture protecting your digital assets in an evolving threat landscape.",
  },
  {
    icon: Repeat,
    title: "Digital Transformation",
    description:
      "Re-engineering business processes for a digital-first economy through agile methodologies.",
  },
  {
    icon: Server,
    title: "Enterprise Infrastructure",
    description:
      "Robust networking, storage, and server solutions tailored for high-scale African operations.",
  },
  {
    icon: LayoutGrid,
    title: "Microsoft Solutions",
    description:
      "Specialized implementation of Microsoft 365, Dynamics, and Power Platform ecosystems.",
    href: "/solutions/microsoft",
  },
  {
    icon: Headset,
    title: "Managed Services",
    description:
      "24/7 proactive monitoring and support to ensure zero-downtime operations.",
  },
  {
    icon: BarChart3,
    title: "Data & Analytics",
    description:
      "Turning raw data into actionable business intelligence through advanced modeling.",
  },
];

export function Solutions() {
  return (
    <section
      id="solutions"
      className="bg-surface-container-lowest py-section relative overflow-hidden"
    >
      <Container>
        <div className="mb-20 text-center">
          <SectionLabel className="mb-2">Our Solutions</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Integrated Technology Ecosystem
          </h2>
        </div>
        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map(({ icon: Icon, title, description, href }) => {
            const className =
              "glass-panel hover-lift border-t-primary/40 group block rounded-xl border-t-2 p-8";
            const content = (
              <>
                <div className="bg-primary/10 group-hover:bg-primary/20 mb-6 flex size-12 items-center justify-center rounded-lg transition-colors">
                  <Icon className="text-primary size-6" />
                </div>
                <h3 className="font-display text-on-surface text-headline-md mb-3 font-semibold">
                  {title}
                </h3>
                <p className="text-on-surface-variant text-sm">{description}</p>
              </>
            );
            return href ? (
              <Link key={title} href={href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={title} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
