import type { MetadataRoute } from "next";
import { PAGE_SEO } from "@/config/seo";
import { POD_LANDING_SLUGS } from "@/lib/eten/pod-landings";
import { COUNTRIES, countryLanguages } from "@/config/countries";
import { FR_PAGES } from "@/config/countries-fr";
import { getSupabaseAdmin } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/seo";

// Rebuilt at most hourly, so newly verified mentors appear without a deploy.
export const revalidate = 3600;

/** Pages in PAGE_SEO that are not live yet (added in later SEO steps). */
const NOT_YET_LIVE = new Set<string>([]);

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/services": 0.9,
  "/solutions/ai": 0.9,
  "/solutions/cloud": 0.9,
  "/solutions/cybersecurity": 0.9,
  "/solutions/data": 0.9,
  "/solutions/microsoft": 0.9,
  "/contact": 0.8,
  "/mentorship": 0.8,
  "/africa": 0.8,
  "/africa/nigeria": 0.95,
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
    ...Object.keys(PAGE_SEO).filter((p) => !NOT_YET_LIVE.has(p)),
    "/women-in-tech",
    ...POD_LANDING_SLUGS.map((s) => `/community/${s}`),
    ...COUNTRIES.map((c) => `/africa/${c.slug}`),
  ];
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/events" ? "weekly" : "monthly",
    priority: PRIORITY[path] ?? (path.startsWith("/africa/") ? 0.8 : 0.7),
  }));

  // French pages (+ hreflang alternates on both language versions).
  const langs = (slug: string) =>
    Object.fromEntries(
      Object.entries(countryLanguages(slug) ?? {})
        .filter(([k]) => k !== "x-default")
        .map(([k, v]) => [k, absoluteUrl(v)]),
    );
  for (const e of entries) {
    const m = e.url.match(/\/africa\/([^/]+)$/);
    if (m) e.alternates = { languages: langs(m[1]) };
  }
  entries.push({
    url: absoluteUrl("/fr/afrique"),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
    alternates: {
      languages: { fr: absoluteUrl("/fr/afrique"), en: absoluteUrl("/africa") },
    },
  });
  for (const p of FR_PAGES) {
    entries.push({
      url: absoluteUrl(`/fr/afrique/${p.c.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: langs(p.enSlug) },
    });
  }

  // Public mentor booking pages (verified mentors with a short handle).
  try {
    const { data } = await getSupabaseAdmin()
      .from("mentor_profiles")
      .select("handle, mentor_status")
      .not("handle", "is", null)
      .neq("mentor_status", "candidate");
    for (const m of data ?? []) {
      entries.push({
        url: absoluteUrl(`/mentorship/m/${m.handle}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // The sitemap still works without mentor pages if the database is down.
  }
  return entries;
}
