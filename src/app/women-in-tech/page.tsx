import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { WIT_PATH, witFaqs } from "@/config/women-in-tech";
import { WitHero } from "@/components/sections/women-in-tech/wit-hero";
import { WitSectionNav } from "@/components/sections/women-in-tech/section-nav";
import { WitAbout } from "@/components/sections/women-in-tech/wit-about";
import {
  WitWhyJoin,
  WitFocusAreas,
  WitWhoShouldJoin,
} from "@/components/sections/women-in-tech/wit-offer";
import { WitProgrammes } from "@/components/sections/women-in-tech/wit-programmes";
import { WitContribute } from "@/components/sections/women-in-tech/wit-contribute";
import { WitValues } from "@/components/sections/women-in-tech/wit-values";
import { WitFaq } from "@/components/sections/women-in-tech/wit-faq";
import { WitFinalCta } from "@/components/sections/women-in-tech/wit-final-cta";
import { WitPageView } from "@/components/sections/women-in-tech/tracking";

const TITLE = "ETEN Women in Tech | Connect, Empower and Lead in Technology";
const DESCRIPTION =
  "Join ETEN Women in Tech, a professional community by Expervia Technologies connecting women through technology learning, mentorship, networking, career development and opportunities.";
const URL = `${siteConfig.url}${WIT_PATH}`;
const OG_IMAGE = `${siteConfig.url}/women-in-tech/og-image.jpg`;

export const metadata: Metadata = {
  // `absolute` skips the "| Expervia" template; the PRD specifies the full title.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "women in tech",
    "women in technology community",
    "technology mentorship",
    "women in AI",
    "women in cybersecurity",
    "women in cloud",
    "technology career development",
    "ETEN",
    "Expervia Technologies",
  ],
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    url: URL,
    siteName: "Expervia Technologies",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ETEN Women in Tech: Connect. Empower. Lead.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// Organization + WebPage + FAQPage structured data. No ratings, events or
// member counts (PRD 14).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: "Expervia Technologies",
      url: siteConfig.url,
      email: siteConfig.contact.emails.general,
      telephone: siteConfig.contact.phones[0],
    },
    {
      "@type": "WebPage",
      "@id": `${URL}#webpage`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      publisher: { "@id": `${siteConfig.url}/#organization` },
      about: {
        "@type": "Organization",
        name: "ETEN Women in Tech",
        slogan: "Connect. Empower. Lead.",
        parentOrganization: { "@id": `${siteConfig.url}/#organization` },
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${URL}#faqs`,
      mainEntity: witFaqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

export default function WomenInTechPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here: content is static config. The
        // "<" escape prevents any "</script>" sequence from breaking out.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <WitPageView />
      <WitHero />
      <WitSectionNav />
      <WitAbout />
      <WitWhyJoin />
      <WitFocusAreas />
      <WitWhoShouldJoin />
      <WitProgrammes />
      <WitContribute />
      <WitValues />
      <WitFaq />
      <WitFinalCta />
    </>
  );
}
