import Link from "next/link";
import {
  Landmark,
  Stethoscope,
  Factory,
  ShoppingBag,
  Zap,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { ButtonLink, Section, SectionIntro } from "@/components/site/ui";

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
    <Section id="sectors" labelledBy="sectors-heading" tone="indigo">
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <SectionIntro
          id="sectors-heading"
          eyebrow="Sector Expertise"
          title="Industries We Support"
          intro="Specialized solutions tailored to the unique regulatory and operational needs of your sector."
          dark
        />
        <ButtonLink
          href="/industries"
          variant="light"
          arrow
          className="shrink-0"
        >
          View all industries
        </ButtonLink>
      </div>
      <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {sectors.map(({ icon: Icon, label }) => (
          <li key={label}>
            <Link
              href="/industries"
              className="focus-visible:ring-brand-300 flex h-full flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center font-semibold backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="text-brand-100 inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Icon aria-hidden className="size-6" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
