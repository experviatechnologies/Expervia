import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  Clock,
  Cloud,
  Coins,
  LayoutGrid,
  MapPin,
  Server,
  ShieldCheck,
  BarChart3,
  Scale,
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
import {
  COUNTRIES,
  FRENCH_PAGES_LIVE,
  SOLUTION_LINKS,
  getCountry,
  type SolutionKey,
} from "@/config/countries";
import { siteConfig } from "@/config/site";
import { absoluteUrl, buildMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

const SOLUTION_ICON: Record<SolutionKey, LucideIcon> = {
  ai: BrainCircuit,
  cloud: Cloud,
  cybersecurity: ShieldCheck,
  data: BarChart3,
  microsoft: LayoutGrid,
  managed: Server,
};

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const c = getCountry((await params).country);
  if (!c) return {};
  return buildMeta({
    title: c.title,
    description: c.description,
    path: `/africa/${c.slug}`,
    locale: `en_${c.iso}`,
    languages: {
      [`en-${c.iso}`]: `/africa/${c.slug}`,
      ...(FRENCH_PAGES_LIVE && c.frSlug
        ? { [`fr-${c.iso}`]: `/fr/afrique/${c.frSlug}` }
        : {}),
      "x-default": `/africa/${c.slug}`,
    },
  });
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const c = getCountry((await params).country);
  if (!c) notFound();

  const url = absoluteUrl(`/africa/${c.slug}`);
  const others = COUNTRIES.filter((o) => o.slug !== c.slug);
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: MapPin, label: "Key cities", value: c.hubs.join(", ") },
    { icon: Clock, label: "Time zone", value: c.timeZone },
    { icon: Coins, label: "Currency", value: c.currency },
    {
      icon: Building2,
      label: "Delivered from",
      value: c.primary ? "Lagos, on the ground" : "Lagos, Nigeria",
    },
  ];

  return (
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
                  name: "Home",
                  item: siteConfig.url,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Africa",
                  item: absoluteUrl("/africa"),
                },
                { "@type": "ListItem", position: 3, name: c.name, item: url },
              ],
            },
            {
              "@type": "Service",
              "@id": `${url}#service`,
              name: `AI, cloud and cybersecurity services ${c.inName}`,
              serviceType: c.priorities.map((p) => SOLUTION_LINKS[p.key].label),
              description: c.description,
              url,
              provider: { "@id": `${siteConfig.url}/#organization` },
              areaServed: { "@type": "Country", name: c.name },
            },
            {
              "@type": "FAQPage",
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
        eyebrow={
          c.primary ? "Nigeria · Headquarters" : `${c.region} · ${c.name}`
        }
        title={c.headline}
        intro={c.intro}
        actions={
          <>
            <ButtonLink href="/contact" variant="light" arrow>
              Book a Consultation
            </ButtonLink>
            <ButtonLink href="/services" variant="outlineLight">
              Explore Our Services
            </ButtonLink>
          </>
        }
      >
        <HeroChips
          label={`Where we work ${c.inName}`}
          items={c.hubs.map((h) => `${h}`)}
        />
      </PageHero>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="border-brand-100 border-b bg-white"
      >
        <ol className="text-ink/60 mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm sm:px-6 lg:px-8">
          <li>
            <Link href="/" className="hover:text-brand-700">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/africa" className="hover:text-brand-700">
              Africa
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-brand-950 font-semibold">
            {c.name}
          </li>
          {FRENCH_PAGES_LIVE && c.frSlug && (
            <li className="ml-auto">
              <Link
                href={`/fr/afrique/${c.frSlug}`}
                hrefLang="fr"
                lang="fr"
                className="text-brand-700 font-semibold hover:underline"
              >
                Lire en français
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
            eyebrow={`Technology ${c.inName}`}
            title={`Why organisations ${c.inName} are investing in AI, cloud and security`}
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
            eyebrow="What we deliver"
            title={`Our services ${c.inName}`}
            intro="Each engagement is tailored, but these are the areas where we most often help."
          />
        </Reveal>
        <ul
          className={cn(
            "mt-14 grid gap-5 sm:grid-cols-2",
            c.priorities.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {c.priorities.map((p, i) => {
            const s = SOLUTION_LINKS[p.key];
            return (
              <Reveal
                as="li"
                key={p.key}
                delay={i * 90}
                className={cn(cardClass, "flex flex-col p-7")}
              >
                <IconBadge icon={SOLUTION_ICON[p.key]} />
                <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                  {s.label}
                </h3>
                <p className="text-ink/75 mt-2 flex-1 leading-relaxed">
                  {p.why}
                </p>
                <Link
                  href={s.href}
                  className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                >
                  {s.label} services
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
              eyebrow="Industries"
              title={`Sectors we support ${c.inName}`}
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
              See all industries
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Reveal>
          <Reveal variant="right" className="flex flex-col gap-5">
            <div className={cn(cardClass, "p-7")}>
              <IconBadge icon={Scale} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                Regulation and data protection
              </h3>
              <p className="text-ink/75 mt-2 leading-relaxed">{c.compliance}</p>
            </div>
            <div className={cn(cardClass, "p-7")}>
              <IconBadge icon={MapPin} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                How we deliver {c.inName}
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
              eyebrow="Questions"
              title={`Working with Expervia ${c.inName}`}
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
            eyebrow="Across Africa"
            title="Other countries we serve"
          />
        </Reveal>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/africa/${o.slug}`}
                className="border-brand-100 text-brand-950 hover:border-brand-300 hover:bg-lavender flex items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-4 font-semibold transition-colors"
              >
                <span>
                  {o.name}
                  {o.primary && (
                    <span className="text-brand-600 ml-2 text-xs font-bold uppercase">
                      HQ
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
        title={`Ready to modernise ${c.inName}?`}
        intro="Tell us about your goals and we will propose a practical first step, from a free assessment to a full programme."
      >
        <ButtonLink href="/contact" variant="light" arrow>
          Talk to Our Team
        </ButtonLink>
        <ButtonLink href="/africa" variant="outlineLight">
          All Countries We Serve
        </ButtonLink>
      </CtaPanel>
    </>
  );
}
