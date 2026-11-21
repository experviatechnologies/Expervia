import { notFound } from "next/navigation";
import {
  CountryLanding,
  FR_STRINGS,
} from "@/components/sections/africa/country-landing";
import { countryLanguages } from "@/config/countries";
import { FR_PAGES, getFrPage } from "@/config/countries-fr";
import { buildMeta } from "@/lib/seo";

export function generateStaticParams() {
  return FR_PAGES.map((p) => ({ pays: p.c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pays: string }>;
}) {
  const p = getFrPage((await params).pays);
  if (!p) return {};
  return buildMeta({
    title: p.c.title,
    description: p.c.description,
    path: `/fr/afrique/${p.c.slug}`,
    locale: `fr_${p.c.iso}`,
    languages: countryLanguages(p.enSlug),
  });
}

/** French country landing page (francophone markets). */
export default async function PaysPage({
  params,
}: {
  params: Promise<{ pays: string }>;
}) {
  const p = getFrPage((await params).pays);
  if (!p) notFound();
  return (
    <CountryLanding
      c={p.c}
      t={FR_STRINGS}
      path={`/fr/afrique/${p.c.slug}`}
      eyebrow={`${p.regionFr} · ${p.c.name}`}
      others={[
        ...FR_PAGES.filter((o) => o.c.slug !== p.c.slug).map((o) => ({
          href: `/fr/afrique/${o.c.slug}`,
          name: o.c.name,
        })),
        { href: "/africa/nigeria", name: "Nigeria (en anglais)", hq: true },
      ]}
      altLink={{
        href: `/africa/${p.enSlug}`,
        label: "Read in English",
        lang: "en",
      }}
    />
  );
}
