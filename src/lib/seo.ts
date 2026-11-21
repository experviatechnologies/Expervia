import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PAGE_SEO, type SeoPath } from "@/config/seo";

/** Absolute URL on the primary domain for a site path ("/about"). */
export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}

const DEFAULT_OG_IMAGE = {
  url: "/join-eten/og-image.png",
  width: 1200,
  height: 630,
  alt: "Expervia Technologies: AI, Cloud and Cybersecurity for Africa",
};

/**
 * Build page metadata with the SEO essentials in one place: title,
 * description, canonical URL, Open Graph and Twitter cards. `absoluteTitle`
 * skips the "| Expervia" template (for titles that already name the brand).
 */
export function buildMeta({
  title,
  description,
  path,
  absoluteTitle = false,
  noindex = false,
  locale = "en_NG",
  languages,
  image,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  noindex?: boolean;
  /** Open Graph locale, e.g. en_NG, en_GH, fr_SN. */
  locale?: string;
  /** hreflang alternates: { "en-GH": "/africa/ghana", ... }. */
  languages?: Record<string, string>;
  image?: { url: string; alt: string; width?: number; height?: number };
}): Metadata {
  const url = absoluteUrl(path);
  const og = image ?? DEFAULT_OG_IMAGE;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      ...(languages && {
        languages: Object.fromEntries(
          Object.entries(languages).map(([k, v]) => [k, absoluteUrl(v)]),
        ),
      }),
    },
    openGraph: {
      type: "website",
      url,
      siteName: "Expervia Technologies",
      title,
      description,
      locale,
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og.url],
    },
    ...(noindex && { robots: { index: false, follow: false } }),
  };
}

/** Metadata for a page listed in PAGE_SEO (src/config/seo.ts). */
export function pageMeta(path: SeoPath): Metadata {
  const entry = PAGE_SEO[path];
  return buildMeta({ ...entry, path });
}
