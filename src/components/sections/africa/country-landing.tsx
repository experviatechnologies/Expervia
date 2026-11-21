import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  Clock,
  Cloud,
  Coins,
  LayoutGrid,
  MapPin,
  Scale,
  Server,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { PageHero, HeroChips } from "@/components/site/page-hero";
import { CtaPanel } from "@/components/site/cta-panel";
import { FaqList } from "@/components/site/faq-list";
import { Reveal } from "@/components/site/reveal";
import {
  ButtonLink,
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
import { JsonLd } from "@/components/seo/json-ld";
import type { Country, SolutionKey } from "@/config/countries";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const SOLUTION_ICON: Record<SolutionKey, LucideIcon> = {
  ai: BrainCircuit,
  cloud: Cloud,
  cybersecurity: ShieldCheck,
  data: BarChart3,
  microsoft: LayoutGrid,
  managed: Server,
};

const SOLUTION_HREF: Record<SolutionKey, string> = {
  ai: "/solutions/ai",
  cloud: "/solutions/cloud",
  cybersecurity: "/solutions/cybersecurity",
  data: "/solutions/data",
  microsoft: "/solutions/microsoft",
  managed: "/services",
};

/** Every piece of fixed page text, so the layout works in English and French. */
export type CountryStrings = {
  lang: "en" | "fr";
  home: string;
  hub: string;
  hubHref: string;
  solutionLabel: Record<SolutionKey, string>;
  servicesLink: (label: string) => string;
  bookCta: string;
  servicesCta: string;
  hubsLabel: (inName: string) => string;
  contextEyebrow: (inName: string) => string;
  contextTitle: (inName: string) => string;
  facts: { cities: string; tz: string; currency: string; from: string };
  fromValue: (primary: boolean) => string;
  servicesEyebrow: string;
  servicesTitle: (inName: string) => string;
  servicesIntro: string;
  industriesEyebrow: string;
  industriesTitle: (inName: string) => string;
  allIndustries: string;
  complianceTitle: string;
  deliveryTitle: (inName: string) => string;
  faqEyebrow: string;
  faqTitle: (inName: string) => string;
  othersEyebrow: string;
  othersTitle: string;
  hqBadge: string;
  ctaTitle: (inName: string) => string;
  ctaIntro: string;
  ctaPrimary: string;
  ctaSecondary: string;
  serviceName: (inName: string) => string;
};

/**
 * One country landing page (English at /africa/<slug>, French at
 * /fr/afrique/<slug>). Content comes from the Country record; fixed text from
 * CountryStrings. Includes Breadcrumb, Service and FAQPage structured data.
 */
export function CountryLanding({
  c,
  t,
  path,
  eyebrow,
  others,
  altLink,
}: {
  c: Country;
  t: CountryStrings;
  /** This page's path, e.g. /africa/ghana. */
  path: string;
  eyebrow: string;
  /** Cross-links to other country pages in the same language. */
  others: { href: string; name: string; hq?: boolean }[];
  /** Link to the same page in the other language. */
  altLink?: { href: string; label: string; lang: "en" | "fr" };
}) {
  const url = absoluteUrl(path);
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: MapPin, label: t.facts.cities, value: c.hubs.join(", ") },
    { icon: Clock, label: t.facts.tz, value: c.timeZone },
    { icon: Coins, label: t.facts.currency, value: c.currency },
    {
      icon: Building2,
      label: t.facts.from,
      value: t.fromValue(Boolean(c.primary)),
    },
  ];

  const body = (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: t.home,
                  item: siteConfig.url,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: t.hub,
                  item: absoluteUrl(t.hubHref),
                },
                { "@type": "ListItem", position: 3, name: c.name, item: url },
              ],
            },
            {
              "@type": "Service",
              "@id": `${url}#service`,
              name: t.serviceName(c.inName),
              serviceType: c.priorities.map((p) => t.solutionLabel[p.key]),
              description: c.description,
              url,
              inLanguage: t.lang,
              provider: { "@id": `${siteConfig.url}/#organization` },
              areaServed: { "@type": "Country", name: c.name },
            },
            {
              "@type": "FAQPage",
              inLanguage: t.lang,
              mainEntity: c.faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ],
        }}
      />

      <PageHero
        id="country-hero"
        eyebrow={eyebrow}
        title={c.headline}
        intro={c.intro}
        actions={
          <>
            <ButtonLink href="/contact" variant="light" arrow>
              {t.bookCta}
            </ButtonLink>
            <ButtonLink href="/services" variant="outlineLight">
              {t.servicesCta}
            </ButtonLink>
          </>
        }
      >
        <HeroChips label={t.hubsLabel(c.inName)} items={c.hubs} />
      </PageHero>

      <nav
        aria-label="Breadcrumb"
        className="border-brand-100 border-b bg-white"
      >
        <ol className="text-ink/60 mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm sm:px-6 lg:px-8">
          <li>
            <Link href="/" className="hover:text-brand-700">
              {t.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={t.hubHref} className="hover:text-brand-700">
              {t.hub}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-brand-950 font-semibold">
            {c.name}
          </li>
          {altLink && (
            <li className="ml-auto">
              <Link
                href={altLink.href}
                hrefLang={altLink.lang}
                lang={altLink.lang}
                className="text-brand-700 font-semibold hover:underline"
              >
                {altLink.label}
              </Link>
            </li>
          )}
        </ol>
      </nav>

      {/* Market context */}
      <Section labelledBy="country-context">
        <Reveal>
          <SectionIntro
            id="country-context"
            eyebrow={t.contextEyebrow(c.inName)}
            title={t.contextTitle(c.inName)}
          />
        </Reveal>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {c.context.map((p, i) => (
            <Reveal
              as="li"
              key={p.title}
              delay={i * 100}
              className={cn(cardClass, "p-7")}
            >
              <h3 className="font-jakarta text-brand-950 text-lg font-bold">
                {p.title}
              </h3>
              <p className="text-ink/75 mt-2 leading-relaxed">{p.body}</p>
            </Reveal>
          ))}
        </ul>
        <Reveal
          as="div"
          className="border-brand-100 bg-lavender mt-8 grid gap-4 rounded-3xl border p-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon
                aria-hidden
                className="text-brand-700 mt-0.5 size-5 shrink-0"
              />
              <div>
                <p className="text-brand-700 text-xs font-bold tracking-[0.16em] uppercase">
                  {label}
                </p>
                <p className="text-brand-950 mt-1 font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Priority services */}
      <Section tone="lavender" labelledBy="country-services">
        <Reveal>
          <SectionIntro
            id="country-services"
            center
            eyebrow={t.servicesEyebrow}
            title={t.servicesTitle(c.inName)}
            intro={t.servicesIntro}
          />
        </Reveal>
        <ul
          className={cn(
            "mt-14 grid gap-5 sm:grid-cols-2",
            c.priorities.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {c.priorities.map((p, i) => {
            const label = t.solutionLabel[p.key];
            return (
              <Reveal
                as="li"
                key={p.key}
                delay={i * 90}
                className={cn(cardClass, "flex flex-col p-7")}
              >
                <IconBadge icon={SOLUTION_ICON[p.key]} />
                <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                  {label}
                </h3>
                <p className="text-ink/75 mt-2 flex-1 leading-relaxed">
                  {p.why}
                </p>
                <Link
                  href={SOLUTION_HREF[p.key]}
                  className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                >
                  {t.servicesLink(label)}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      {/* Industries + compliance */}
      <Section labelledBy="country-industries">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="left">
            <SectionIntro
              id="country-industries"
              eyebrow={t.industriesEyebrow}
              title={t.industriesTitle(c.inName)}
            />
            <ul className="mt-8 flex flex-wrap gap-3">
              {c.industries.map((ind) => (
                <li
                  key={ind}
                  className="border-brand-100 text-brand-900 rounded-full border bg-white px-5 py-2.5 text-[0.95rem] font-medium"
                >
                  {ind}
                </li>
              ))}
            </ul>
            <Link
              href="/industries"
              className="text-brand-700 mt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t.allIndustries}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Reveal>
          <Reveal variant="right" className="flex flex-col gap-5">
            <div className={cn(cardClass, "p-7")}>
              <IconBadge icon={Scale} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {t.complianceTitle}
              </h3>
              <p className="text-ink/75 mt-2 leading-relaxed">{c.compliance}</p>
            </div>
            <div className={cn(cardClass, "p-7")}>
              <IconBadge icon={MapPin} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {t.deliveryTitle(c.inName)}
              </h3>
              <p className="text-ink/75 mt-2 leading-relaxed">{c.delivery}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="lavender" labelledBy="country-faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal variant="left">
            <SectionIntro
              id="country-faq"
              eyebrow={t.faqEyebrow}
              title={t.faqTitle(c.inName)}
            />
          </Reveal>
          <Reveal variant="right" delay={100}>
            <FaqList items={c.faqs} />
          </Reveal>
        </div>
      </Section>

      {/* Other countries (internal links) */}
      <Section labelledBy="country-others">
        <Reveal>
          <SectionIntro
            id="country-others"
            eyebrow={t.othersEyebrow}
            title={t.othersTitle}
          />
        </Reveal>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <li key={o.href}>
              <Link
                href={o.href}
                className="border-brand-100 text-brand-950 hover:border-brand-300 hover:bg-lavender flex items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-4 font-semibold transition-colors"
              >
                <span>
                  {o.name}
                  {o.hq && (
                    <span className="text-brand-600 ml-2 text-xs font-bold uppercase">
                      {t.hqBadge}
                    </span>
                  )}
                </span>
                <ArrowRight aria-hidden className="text-brand-600 size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaPanel
        id="country-cta"
        title={t.ctaTitle(c.inName)}
        intro={t.ctaIntro}
      >
        <ButtonLink href="/contact" variant="light" arrow>
          {t.ctaPrimary}
        </ButtonLink>
        <ButtonLink href={t.hubHref} variant="outlineLight">
          {t.ctaSecondary}
        </ButtonLink>
      </CtaPanel>
    </>
  );

  // The root <html> is English; French pages declare their language here.
  return t.lang === "fr" ? <div lang="fr">{body}</div> : body;
}

export const EN_STRINGS: CountryStrings = {
  lang: "en",
  home: "Home",
  hub: "Africa",
  hubHref: "/africa",
  solutionLabel: {
    ai: "AI & Intelligence",
    cloud: "Cloud & Infrastructure",
    cybersecurity: "Cybersecurity",
    data: "Data & Analytics",
    microsoft: "Microsoft Solutions",
    managed: "Managed Services",
  },
  servicesLink: (label) => `${label} services`,
  bookCta: "Book a Consultation",
  servicesCta: "Explore Our Services",
  hubsLabel: (inName) => `Where we work ${inName}`,
  contextEyebrow: (inName) => `Technology ${inName}`,
  contextTitle: (inName) =>
    `Why organisations ${inName} are investing in AI, cloud and security`,
  facts: {
    cities: "Key cities",
    tz: "Time zone",
    currency: "Currency",
    from: "Delivered from",
  },
  fromValue: (primary) => (primary ? "Lagos, on the ground" : "Lagos, Nigeria"),
  servicesEyebrow: "What we deliver",
  servicesTitle: (inName) => `Our services ${inName}`,
  servicesIntro:
    "Each engagement is tailored, but these are the areas where we most often help.",
  industriesEyebrow: "Industries",
  industriesTitle: (inName) => `Sectors we support ${inName}`,
  allIndustries: "See all industries",
  complianceTitle: "Regulation and data protection",
  deliveryTitle: (inName) => `How we deliver ${inName}`,
  faqEyebrow: "Questions",
  faqTitle: (inName) => `Working with Expervia ${inName}`,
  othersEyebrow: "Across Africa",
  othersTitle: "Other countries we serve",
  hqBadge: "HQ",
  ctaTitle: (inName) => `Ready to modernise ${inName}?`,
  ctaIntro:
    "Tell us about your goals and we will propose a practical first step, from a free assessment to a full programme.",
  ctaPrimary: "Talk to Our Team",
  ctaSecondary: "All Countries We Serve",
  serviceName: (inName) => `AI, cloud and cybersecurity services ${inName}`,
};

export const FR_STRINGS: CountryStrings = {
  lang: "fr",
  home: "Accueil",
  hub: "Afrique",
  hubHref: "/fr/afrique",
  solutionLabel: {
    ai: "IA et intelligence",
    cloud: "Cloud et infrastructure",
    cybersecurity: "Cybersécurité",
    data: "Données et analytique",
    microsoft: "Solutions Microsoft",
    managed: "Services managés",
  },
  servicesLink: (label) => `En savoir plus : ${label} (en anglais)`,
  bookCta: "Demander une consultation",
  servicesCta: "Nos services",
  hubsLabel: (inName) => `Nos villes d'intervention ${inName}`,
  contextEyebrow: (inName) => `Le numérique ${inName}`,
  contextTitle: (inName) =>
    `Pourquoi les organisations ${inName} investissent dans l'IA, le cloud et la sécurité`,
  facts: {
    cities: "Villes clés",
    tz: "Fuseau horaire",
    currency: "Devise",
    from: "Accompagnement depuis",
  },
  fromValue: (primary) => (primary ? "Lagos, sur place" : "Lagos, Nigeria"),
  servicesEyebrow: "Ce que nous faisons",
  servicesTitle: (inName) => `Nos services ${inName}`,
  servicesIntro:
    "Chaque mission est sur mesure, mais voici les domaines dans lesquels nous intervenons le plus souvent.",
  industriesEyebrow: "Secteurs",
  industriesTitle: (inName) => `Les secteurs que nous accompagnons ${inName}`,
  allIndustries: "Tous les secteurs (en anglais)",
  complianceTitle: "Réglementation et protection des données",
  deliveryTitle: (inName) => `Notre façon de travailler ${inName}`,
  faqEyebrow: "Questions fréquentes",
  faqTitle: (inName) => `Travailler avec Expervia ${inName}`,
  othersEyebrow: "En Afrique",
  othersTitle: "Les autres pays que nous accompagnons",
  hqBadge: "Siège",
  ctaTitle: (inName) => `Prêt à moderniser votre organisation ${inName} ?`,
  ctaIntro:
    "Parlez-nous de vos objectifs : nous vous proposerons une première étape concrète, d'un diagnostic gratuit à un programme complet.",
  ctaPrimary: "Contacter notre équipe",
  ctaSecondary: "Tous les pays",
  serviceName: (inName) =>
    `Services d'IA, de cloud et de cybersécurité ${inName}`,
};
