import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Cloud,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
  type Tone,
} from "@/components/site/ui";
import { COUNTRIES } from "@/config/countries";
import { cn } from "@/lib/utils";

/*
 * Internal-linking blocks (SEO step 4): descriptive links between the
 * solution pages, and from core pages to the country landing pages, so
 * search engines (and people) can reach every important page in a click or
 * two and understand what each one is about.
 */

const SOLUTIONS: {
  slug: "ai" | "cloud" | "cybersecurity" | "data" | "microsoft";
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    slug: "ai",
    icon: BrainCircuit,
    title: "AI solutions and consulting",
    body: "Generative AI, Copilot and automation, governed from day one.",
  },
  {
    slug: "cloud",
    icon: Cloud,
    title: "Cloud migration and Azure",
    body: "Plan, migrate and run on Azure and Huawei Cloud.",
  },
  {
    slug: "cybersecurity",
    icon: ShieldCheck,
    title: "Cybersecurity services",
    body: "Assessments, Zero Trust, identity and security monitoring.",
  },
  {
    slug: "data",
    icon: BarChart3,
    title: "Data and analytics",
    body: "Microsoft Fabric, Power BI and data governance.",
  },
  {
    slug: "microsoft",
    icon: LayoutGrid,
    title: "Microsoft solutions",
    body: "Microsoft 365, Dynamics 365 and Power Platform.",
  },
];

/** Country links, Nigeria first. */
function CountryChips({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2.5", className)}>
      {COUNTRIES.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/africa/${c.slug}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              c.primary
                ? "border-brand-700 bg-brand-700 hover:bg-brand-600 text-white"
                : "border-brand-100 text-brand-900 hover:border-brand-300 hover:bg-lavender bg-white",
            )}
          >
            {c.primary && <MapPin aria-hidden className="size-3.5" />}
            {c.primary ? "Nigeria (HQ)" : c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Explore related solutions" for the bottom of a solution page: links to the
 * other four solutions and to the country pages.
 */
export function RelatedSolutions({
  current,
  tone = "lavender",
}: {
  current: (typeof SOLUTIONS)[number]["slug"];
  tone?: Tone;
}) {
  const others = SOLUTIONS.filter((s) => s.slug !== current);
  return (
    <Section tone={tone} labelledBy="related-solutions">
      <Reveal>
        <SectionIntro
          id="related-solutions"
          eyebrow="Explore more"
          title="Related solutions"
          intro="Most programmes combine several of these. See how they fit together, or browse all our services."
        />
      </Reveal>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={i * 80}>
            <Link
              href={`/solutions/${s.slug}`}
              className={cn(cardClass, "group flex h-full flex-col p-6")}
            >
              <IconBadge icon={s.icon} />
              <span className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {s.title}
              </span>
              <span className="text-ink/70 mt-2 flex-1 leading-relaxed">
                {s.body}
              </span>
              <span className="text-brand-700 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                Learn more
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-brand-950 font-semibold">
          Delivered from Lagos to organisations across Africa:
        </p>
        <Link
          href="/services"
          className="text-brand-700 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          All IT services
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Reveal>
      <CountryChips className="mt-4" />
    </Section>
  );
}

/**
 * "Serving Nigeria and Africa" band for core pages (home, services,
 * industries, about, contact): Nigeria first, then every country page.
 */
export function ServingAfrica({ tone = "white" }: { tone?: Tone }) {
  return (
    <Section tone={tone} labelledBy="serving-africa">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal variant="left">
          <SectionIntro
            id="serving-africa"
            eyebrow="Where we work"
            title={
              <>
                Headquartered in Lagos.{" "}
                <span className="text-brand-600">Serving Africa.</span>
              </>
            }
            intro="Nigeria is home. From Lagos we deliver AI, cloud, cybersecurity and data to organisations in 13 African countries, remotely and on site, in English and French."
          />
          <Link
            href="/africa"
            className="text-brand-700 mt-6 inline-flex items-center gap-1.5 font-semibold hover:underline"
          >
            See all the countries we serve
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </Reveal>
        <Reveal variant="right" delay={100}>
          <CountryChips />
          <p className="text-ink/60 mt-5 text-sm">
            Francophone teams:{" "}
            <Link
              href="/fr/afrique"
              hrefLang="fr"
              lang="fr"
              className="text-brand-700 font-semibold hover:underline"
            >
              nos pages en français
            </Link>
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
