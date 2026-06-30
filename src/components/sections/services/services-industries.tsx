import Link from "next/link";
import {
  Landmark,
  Stethoscope,
  Factory,
  ShoppingBag,
  Zap,
  Building2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const sectors: { icon: LucideIcon; label: string }[] = [
  { icon: Landmark, label: "FSI & Banking" },
  { icon: Stethoscope, label: "Healthcare" },
  { icon: Factory, label: "Manufacturing" },
  { icon: ShoppingBag, label: "Retail" },
  { icon: Zap, label: "Energy" },
  { icon: Building2, label: "Public Sector" },
];

export function ServicesIndustries() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <SectionLabel className="mb-4">Sector Expertise</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
              Industries We Support
            </h2>
            <p className="text-on-surface-variant text-body-lg">
              Specialized solutions tailored to the unique regulatory and
              operational needs of your sector.
            </p>
          </div>
          <Link
            href="/industries"
            className="text-primary inline-flex shrink-0 items-center gap-2 font-bold hover:gap-3"
          >
            View all industries
            <ArrowRight className="size-4 transition-all" />
          </Link>
        </div>

        <div className="gap-gutter grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {sectors.map(({ icon: Icon, label }) => (
            <Link
              key={label}
              href="/industries"
              className="bg-surface-container hover:border-primary/40 flex flex-col items-center rounded-xl border border-transparent p-6 text-center transition-colors"
            >
              <Icon className="text-primary mb-4 size-8" />
              <span className="text-body-md text-on-surface">{label}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
