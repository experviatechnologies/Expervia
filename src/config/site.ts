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
    { title: "Solutions", href: "#solutions" },
    { title: "Industries", href: "#industries" },
    { title: "Resources", href: "#resources" },
    { title: "About Us", href: "/about" },
  ],
  // Footer link columns.
  footerNav: {
    company: [
      { title: "About Us", href: "#about" },
      { title: "Careers", href: "#careers" },
      { title: "Newsroom", href: "#newsroom" },
      { title: "Events", href: "#events" },
      { title: "Contact", href: "#contact" },
    ],
    legal: [
      { title: "Privacy Policy", href: "#privacy" },
      { title: "Terms of Service", href: "#terms" },
      { title: "Compliance", href: "#compliance" },
      { title: "Security Architecture", href: "#security" },
      { title: "Cookie Policy", href: "#cookies" },
    ],
  },
  contact: {
    address: "23 Hogan Bassey, Lakowe Lakes, Lagos.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
