/**
 * Central place for global, app-wide constants (site name, description,
 * primary nav links, social URLs, etc). Import from here instead of
 * hardcoding strings across components.
 */
export const siteConfig = {
  name: "Expervia",
  description:
    "Expervia Technologies powers Africa's intelligent enterprise through AI, Cloud, and Digital Transformation — a Microsoft AI Cloud Partner, CSP, and Huawei Enterprise Partner.",
  url: "https://expervia.com",
  // Primary navigation links, consumed by the Navbar.
  navLinks: [
    { title: "Solutions", href: "/#solutions" },
    { title: "Industries", href: "/industries" },
    { title: "Services", href: "/services" },
    { title: "About Us", href: "/about" },
  ],
  // Footer link columns.
  footerNav: {
    company: [
      { title: "About Us", href: "/about" },
      { title: "Careers", href: "#careers" },
      { title: "Newsroom", href: "#newsroom" },
      { title: "Events", href: "#events" },
      { title: "Contact", href: "/contact" },
    ],
    legal: [
      { title: "Privacy Policy", href: "#privacy" },
      { title: "Terms of Service", href: "#terms" },
      { title: "Compliance", href: "#compliance" },
      { title: "Security Architecture", href: "#security" },
      { title: "Cookie Policy", href: "#cookies" },
    ],
  },
  // Single source of truth for contact details (used by the Contact page,
  // footer, etc). NOTE: address differs between the original Stitch exports —
  // this is the Contact page's "Global Head Office"; confirm it's correct.
  contact: {
    address:
      "Plot 21A Olubunmi Rotimi Street, Off Abike Sulaiman Street, Lekki Phase 1, Lagos 106104, Nigeria",
    // Used to center the embedded map. For an EXACT pin, replace this with
    // "latitude,longitude" coordinates (right-click the spot in Google Maps →
    // copy the coords). A text address geocodes to an approximate location.
    mapQuery: "Plot 21A Olubunmi Rotimi Street, Lekki Phase 1, Lagos, Nigeria",
    phone: "+234 (0) 1 234 5678",
    website: "www.experviatechnologies.com",
    emails: {
      general: "info@experviatechnologies.com",
      sales: "sales@experviatechnologies.com",
      partnerships: "partnerships@experviatechnologies.com",
      support: "support@experviatechnologies.com",
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
