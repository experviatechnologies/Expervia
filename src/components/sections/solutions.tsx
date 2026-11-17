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
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

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
    href: "/solutions/cybersecurity",
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
    href: "/solutions/data",
  },
];

export function Solutions() {
  return (
    <Section id="solutions" labelledBy="solutions-heading">
      <SectionIntro
        id="solutions-heading"
        eyebrow="Our Solutions"
        title="Integrated Technology Ecosystem"
        center
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {solutions.map(({ icon, title, description, href }, i) => {
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
                  className="font-jakarta text-brand-200 text-sm font-bold"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {title}
              </h3>
              <p className="text-ink/75 mt-2.5 flex-1 leading-relaxed">
                {description}
              </p>
              {href && (
                <span className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Learn more
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              )}
            </>
          );
          const className =
            "group border-brand-100 hover:border-brand-300 focus-visible:ring-brand-400 relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(33,0,93,0.45)] focus-visible:ring-2 focus-visible:outline-none";
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
        })}
      </ul>
    </Section>
  );
}
