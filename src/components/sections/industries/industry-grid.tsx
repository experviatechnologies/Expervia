import {
  Landmark,
  Building2,
  Stethoscope,
  GraduationCap,
  RadioTower,
  Factory,
  Zap,
  ShoppingBag,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

type Industry = {
  icon: LucideIcon;
  title: string;
  tagline: string;
  description: string;
  solutions: string[];
  outcome: string;
};

const industries: Industry[] = [
  {
    icon: Landmark,
    title: "Financial Services",
    tagline: "Building the Future of Digital Finance",
    description:
      "Modernizing legacy banking cores and enabling secure, real-time transaction processing with AI-driven fraud detection and regulatory compliance automation.",
    solutions: ["Secure Cloud", "AI Fraud Detection"],
    outcome: "Compliance & Trust",
  },
  {
    icon: Building2,
    title: "Government & Public Sector",
    tagline: "Enabling Digital Government",
    description:
      "Accelerating citizen-centric services through secure cloud migration and data sovereignty solutions that prioritize privacy and accessibility.",
    solutions: ["Citizen Portals", "Secure Data"],
    outcome: "Efficiency & Accessibility",
  },
  {
    icon: Stethoscope,
    title: "Healthcare",
    tagline: "Driving Better Healthcare Through Tech",
    description:
      "Empowering providers with interoperable data systems and AI-powered diagnostic support while maintaining the highest levels of patient data security.",
    solutions: ["Telehealth", "HISP Compliance"],
    outcome: "Patient Outcomes",
  },
  {
    icon: GraduationCap,
    title: "Education",
    tagline: "Empowering Learning in the Digital Age",
    description:
      "Creating modern hybrid learning environments with scalable infrastructure and AI-driven personalized learning paths for students and faculty.",
    solutions: ["LMS Integration", "Virtual Labs"],
    outcome: "Global Engagement",
  },
  {
    icon: RadioTower,
    title: "Telecommunications",
    tagline: "Enabling Connectivity and Innovation",
    description:
      "Optimizing network operations through edge computing and AI-powered predictive maintenance, ensuring high-speed connectivity and lower churn.",
    solutions: ["5G Optimization", "IoT Mesh"],
    outcome: "Network Resilience",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    tagline: "Intelligent Manufacturing for the Future",
    description:
      "Implementing Industry 4.0 standards with digital twins and real-time shop floor visibility to reduce waste and maximize throughput.",
    solutions: ["Smart Factory", "Supply Chain"],
    outcome: "Operational Speed",
  },
  {
    icon: Zap,
    title: "Energy & Utilities",
    tagline: "Powering Smarter Operations",
    description:
      "Managing smart grids and distributed energy resources with data analytics that optimize consumption patterns and grid stability.",
    solutions: ["Grid Analytics", "Renewables AI"],
    outcome: "Sustainability",
  },
  {
    icon: ShoppingBag,
    title: "Retail & Commerce",
    tagline: "Transforming Customer Experiences",
    description:
      "Unifying physical and digital storefronts with omnichannel commerce platforms and hyper-personalized customer engagement engines.",
    solutions: ["Omnichannel", "AI Inventory"],
    outcome: "Customer Loyalty",
  },
  {
    icon: Briefcase,
    title: "Professional Services",
    tagline: "Modernizing Service Delivery",
    description:
      "Optimizing billable utilization and project delivery with integrated cloud collaboration tools and automated business processes.",
    solutions: ["Cloud ERP", "Secure Docs"],
    outcome: "Profitability",
  },
];

export function IndustryGrid() {
  return (
    <Section id="sectors" labelledBy="sectors-heading">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <SectionIntro
          id="sectors-heading"
          eyebrow="Our sectors"
          title="Transforming Your Sector"
          intro="We bring deep domain expertise to help you navigate specific digital transitions within your industry landscape."
        />
        <p className="bg-lavender text-brand-800 shrink-0 rounded-full px-4 py-2 text-xs font-bold tracking-[0.18em] uppercase">
          {industries.length} Core Specializations
        </p>
      </div>
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {industries.map(
          ({ icon, title, tagline, description, solutions, outcome }) => (
            <li
              key={title}
              className="group border-brand-100 hover:border-brand-300 relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(33,0,93,0.45)]"
            >
              <span
                aria-hidden
                className="from-brand-900 via-brand-600 to-brand-300 absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100"
              />
              <IconBadge icon={icon} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-xl font-bold">
                {title}
              </h3>
              <p className="text-brand-600 mt-1 text-sm font-semibold">
                {tagline}
              </p>
              <p className="text-ink/75 mt-3 flex-1 leading-relaxed">
                {description}
              </p>
              <div className="border-brand-100 mt-6 space-y-4 border-t pt-5">
                <div>
                  <p className="text-ink/50 text-xs font-bold tracking-[0.16em] uppercase">
                    Solutions include
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {solutions.map((s) => (
                      <li
                        key={s}
                        className="bg-lavender text-brand-800 rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-ink/50 text-xs font-bold tracking-[0.16em] uppercase">
                    Outcomes
                  </p>
                  <p className="text-brand-700 mt-1 font-semibold">{outcome}</p>
                </div>
              </div>
            </li>
          ),
        )}
      </ul>
    </Section>
  );
}
