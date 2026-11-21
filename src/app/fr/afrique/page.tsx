import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { FR_PAGES } from "@/config/countries-fr";
import { absoluteUrl, buildMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMeta({
  title: "Services IT en Afrique francophone | Expervia",
  absoluteTitle: true,
  description:
    "Depuis Lagos, Expervia accompagne les organisations en Côte d'Ivoire, au Sénégal, au Cameroun, au Maroc et en RDC : IA, cloud, cybersécurité et données.",
  path: "/fr/afrique",
  locale: "fr_FR",
  languages: { fr: "/fr/afrique", en: "/africa", "x-default": "/africa" },
});

/** French hub for the francophone country pages. */
export default function AfriqueFrancophonePage() {
  return (
    <div lang="fr">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Pays francophones accompagnés par Expervia",
          inLanguage: "fr",
          itemListElement: FR_PAGES.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.c.name,
            url: absoluteUrl(`/fr/afrique/${p.c.slug}`),
          })),
        }}
      />
      <PageHero
        id="afrique-hero"
        eyebrow="Afrique francophone"
        title={
          <>
            IA, cloud et cybersécurité pour{" "}
            <span className="text-brand-200">l&apos;Afrique francophone.</span>
          </>
        }
        intro="Expervia Technologies est basée à Lagos, au Nigeria. Nous accompagnons les organisations d'Afrique de l'Ouest, d'Afrique centrale et du Maghreb, à distance et sur site, en français comme en anglais."
        actions={
          <>
            <ButtonLink href="/contact" variant="light" arrow>
              Contacter notre équipe
            </ButtonLink>
            <ButtonLink href="/africa" variant="outlineLight" hrefLang="en">
              Read in English
            </ButtonLink>
          </>
        }
      />

      <Section labelledBy="afrique-pays">
        <Reveal>
          <SectionIntro
            id="afrique-pays"
            eyebrow="Nos pays"
            title="Les pays francophones que nous accompagnons"
          />
        </Reveal>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FR_PAGES.map((p, i) => (
            <Reveal as="li" key={p.c.slug} delay={i * 90}>
              <Link
                href={`/fr/afrique/${p.c.slug}`}
                className={cn(cardClass, "group flex h-full flex-col p-7")}
              >
                <span className="font-jakarta text-brand-950 text-xl font-bold">
                  {p.c.name}
                </span>
                <span className="text-brand-600 mt-1 text-sm font-semibold">
                  {p.c.hubs.join(" · ")}
                </span>
                <span className="text-ink/75 mt-4 flex-1 leading-relaxed">
                  {p.c.description}
                </span>
                <span className="text-brand-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Nos services {p.c.inName}
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

      <CtaPanel
        id="afrique-cta"
        title="Un projet dans plusieurs pays africains ?"
        intro="Nous aidons les organisations à faire fonctionner une même plateforme sécurisée sur plusieurs marchés africains."
      >
        <ButtonLink href="/contact" variant="light" arrow>
          Parlons-en
        </ButtonLink>
        <ButtonLink href="/africa" variant="outlineLight" hrefLang="en">
          Tous les pays (en anglais)
        </ButtonLink>
      </CtaPanel>
    </div>
  );
}
