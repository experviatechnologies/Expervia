import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { CtaPanel } from "@/components/site/cta-panel";
import { Reveal } from "@/components/site/reveal";
import {
  ButtonLink,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
import { JsonLd } from "@/components/seo/json-ld";
import { COUNTRIES, type Country } from "@/config/countries";
import { siteConfig } from "@/config/site";
import { absoluteUrl, pageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = {
  ...pageMeta("/africa"),
  alternates: {
    ...pageMeta("/africa").alternates,
    languages: {
      en: absoluteUrl("/africa"),
      fr: absoluteUrl("/fr/afrique"),
      "x-default": absoluteUrl("/africa"),
    },
  },
};

const REGIONS: Country["region"][] = [
  "West Africa",
  "East Africa",
  "Central Africa",
  "Southern Africa",
  "North Africa",
];

export default function AfricaPage() {
  const nigeria = COUNTRIES.find((c) => c.primary)!;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Countries Expervia serves",
          itemListElement: COUNTRIES.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            url: absoluteUrl(`/africa/${c.slug}`),
          })),
        }}
      />
      <PageHero
        id="africa-hero"
        eyebrow="Where we work"
        title={
          <>
            From Lagos to{" "}
            <span className="text-brand-200">13 African markets.</span>
          </>
        }
        intro="Expervia is headquartered in Lagos, Nigeria. From there we deliver AI, cloud, cybersecurity and data solutions to organisations across West, East, Central, Southern and North Africa, remotely and on site."
        actions={
          <>
            <ButtonLink href={`/africa/${nigeria.slug}`} variant="light" arrow>
              Expervia in Nigeria
            </ButtonLink>
            <ButtonLink href="/contact" variant="outlineLight">
              Talk to Our Team
            </ButtonLink>
            <ButtonLink
              href="/fr/afrique"
              variant="outlineLight"
              hrefLang="fr"
              lang="fr"
            >
              Afrique francophone (FR)
            </ButtonLink>
          </>
        }
      />

      <Section labelledBy="africa-hq">
        <Reveal
          variant="zoom"
          className="from-brand-950 via-brand-900 to-brand-700 grid gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
        >
          <div>
            <p className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
              Headquarters
            </p>
            <h2
              id="africa-hq"
              className="font-jakarta mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Nigeria is home
            </h2>
            <p className="text-brand-100/85 mt-4 text-lg leading-relaxed">
              {nigeria.intro}
            </p>
            <ButtonLink
              href={`/africa/${nigeria.slug}`}
              variant="light"
              arrow
              className="mt-8"
            >
              Our Nigeria Services
            </ButtonLink>
          </div>
          <ul className="grid gap-3">
            {nigeria.hubs.map((h) => (
              <li
                key={h}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-4 font-semibold backdrop-blur"
              >
                <MapPin aria-hidden className="text-brand-200 size-5" />
                {h}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {REGIONS.map((region, ri) => {
        const list = COUNTRIES.filter((c) => c.region === region && !c.primary);
        if (list.length === 0) return null;
        const id = `region-${region.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <Section
            key={region}
            tone={ri % 2 === 0 ? "lavender" : "white"}
            labelledBy={id}
          >
            <Reveal>
              <SectionIntro id={id} eyebrow="Region" title={region} />
            </Reveal>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c, i) => (
                <Reveal as="li" key={c.slug} delay={i * 90}>
                  <Link
                    href={`/africa/${c.slug}`}
                    className={cn(cardClass, "group flex h-full flex-col p-7")}
                  >
                    <span className="font-jakarta text-brand-950 text-xl font-bold">
                      {c.name}
                    </span>
                    <span className="text-brand-600 mt-1 text-sm font-semibold">
                      {c.hubs.join(" · ")}
                    </span>
                    <span className="text-ink/75 mt-4 flex-1 leading-relaxed">
                      {c.description}
                    </span>
                    <span className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                      Services {c.inName}
                      <ArrowRight
                        aria-hidden
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </Section>
        );
      })}

      <CtaPanel
        id="africa-cta"
        title="Working across borders?"
        intro={`We help organisations run one secure platform across several African markets. Call us on ${siteConfig.contact.phones[0]} or send a message.`}
      >
        <ButtonLink href="/contact" variant="light" arrow>
          Contact Us
        </ButtonLink>
        <ButtonLink href="/services" variant="outlineLight">
          Our Services
        </ButtonLink>
      </CtaPanel>
    </>
  );
}
