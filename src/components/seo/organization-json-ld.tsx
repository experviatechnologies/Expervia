import { siteConfig } from "@/config/site";
import { AREA_SERVED } from "@/config/seo";

/**
 * Site-wide structured data (schema.org): who Expervia is, where it is based
 * (Lagos, Nigeria) and the countries it serves. Helps search engines show the
 * business correctly for local (Nigeria) and regional (Africa) searches.
 */
export function OrganizationJsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${siteConfig.url}/#organization`,
        name: "Expervia Technologies",
        alternateName: "Expervia",
        url: siteConfig.url,
        logo: `${siteConfig.url}/expervia-logo.png`,
        image: `${siteConfig.url}/join-eten/og-image.png`,
        description: siteConfig.description,
        email: siteConfig.contact.emails.general,
        telephone: siteConfig.contact.phones[0],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Lakowe Lakes Golf & Country Estate, Lekki",
          addressLocality: "Lagos",
          addressRegion: "Lagos",
          addressCountry: "NG",
        },
        areaServed: AREA_SERVED.map((name) => ({ "@type": "Country", name })),
        knowsAbout: [
          "Artificial intelligence",
          "Cloud computing",
          "Microsoft Azure",
          "Microsoft 365",
          "Cybersecurity",
          "Data analytics",
          "Digital transformation",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: "Expervia Technologies",
        publisher: { "@id": `${siteConfig.url}/#organization` },
        inLanguage: ["en", "fr"],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // Static, server-built JSON; "<" is escaped so it can't close the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(org).replace(/</g, "\\u003c"),
      }}
    />
  );
}
