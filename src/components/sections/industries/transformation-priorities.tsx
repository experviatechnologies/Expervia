import Link from "next/link";
import {
  BrainCircuit,
  CloudCog,
  ShieldCheck,
  BarChart3,
  Rocket,
  LayoutGrid,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

type Priority = { icon: LucideIcon; label: string; href?: string };

// `href` links a priority to its dedicated solution page. Items without one
// are placeholders until their page is built.
const priorities: Priority[] = [
  { icon: BrainCircuit, label: "AI & Intelligence", href: "/solutions/ai" },
  { icon: CloudCog, label: "Cloud Transformation", href: "/solutions/cloud" },
  {
    icon: ShieldCheck,
    label: "Cybersecurity",
    href: "/solutions/cybersecurity",
  },
  { icon: BarChart3, label: "Data & Analytics", href: "/solutions/data" },
  { icon: Rocket, label: "Digital Evolution" },
  {
    icon: LayoutGrid,
    label: "Microsoft Solutions",
    href: "/solutions/microsoft",
  },
];

export function TransformationPriorities() {
  return (
    <Section id="priorities" labelledBy="priorities-heading" tone="lavender">
      <SectionIntro
        id="priorities-heading"
        eyebrow="Across every sector"
        title="Core Transformation Priorities"
        intro="Expertise that spans sectors to deliver universal value across the enterprise landscape."
        center
      />
      <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {priorities.map(({ icon, label, href }) => {
          const content = (
            <>
              <IconBadge icon={icon} />
              <span className="font-jakarta text-brand-950 font-bold">
                {label}
              </span>
              {href && (
                <ArrowRight
                  aria-hidden
                  className="text-brand-600 size-4 transition-transform group-hover:translate-x-0.5"
                />
              )}
            </>
          );
          const className =
            "group border-brand-100 flex h-full flex-col items-center gap-3 rounded-3xl border bg-white p-6 text-center";
          return (
            <li key={label}>
              {href ? (
                <Link
                  href={href}
                  className={`${className} hover:border-brand-300 focus-visible:ring-brand-400 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(33,0,93,0.35)] focus-visible:ring-2 focus-visible:outline-none`}
                >
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
