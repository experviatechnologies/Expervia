import { notFound } from "next/navigation";
import {
  CountryLanding,
  EN_STRINGS,
} from "@/components/sections/africa/country-landing";
import {
  COUNTRIES,
  FRENCH_PAGES_LIVE,
  countryLanguages,
  getCountry,
} from "@/config/countries";
import { buildMeta } from "@/lib/seo";

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
    languages: countryLanguages(c.slug),
  });
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const c = getCountry((await params).country);
  if (!c) notFound();

  return (
    <CountryLanding
      c={c}
      t={EN_STRINGS}
      path={`/africa/${c.slug}`}
      eyebrow={c.primary ? "Nigeria · Headquarters" : `${c.region} · ${c.name}`}
      others={COUNTRIES.filter((o) => o.slug !== c.slug).map((o) => ({
        href: `/africa/${o.slug}`,
        name: o.name,
        hq: o.primary,
      }))}
      altLink={
        FRENCH_PAGES_LIVE && c.frSlug
          ? {
              href: `/fr/afrique/${c.frSlug}`,
              label: "Lire en français",
              lang: "fr",
            }
          : undefined
      }
    />
  );
}
