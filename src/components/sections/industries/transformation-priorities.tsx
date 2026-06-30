import Link from "next/link";
import {
  BrainCircuit,
  CloudCog,
  ShieldCheck,
  BarChart3,
  Rocket,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";

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

const cardClasses =
  "bg-surface-container hover:bg-surface-container-high flex flex-col items-center rounded-xl p-6 text-center transition-colors";

export function TransformationPriorities() {
  return (
    <section className="bg-surface py-section relative overflow-hidden">
      <Container className="relative z-10">
        <div className="mb-16 text-center">
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Core Transformation Priorities
          </h2>
          <p className="text-body-lg text-on-surface-variant mx-auto max-w-2xl">
            Expertise that spans sectors to deliver universal value across the
            enterprise landscape.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {priorities.map(({ icon: Icon, label, href }) => {
            const content = (
              <>
                <Icon className="text-primary mb-4 size-8" />
                <span className="text-body-md text-on-surface">{label}</span>
              </>
            );
            return href ? (
              <Link
                key={label}
                href={href}
                className={`${cardClasses} hover:border-primary/40 border border-transparent`}
              >
                {content}
              </Link>
            ) : (
              <div key={label} className={cardClasses}>
                {content}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
