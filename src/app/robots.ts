import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** robots.txt: public marketing and mentorship pages are crawlable; signed-in
 * apps, consoles and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/tracker",
          "/auth/",
          "/dashboard",
          "/onboarding",
          "/profile",
          "/members",
          "/feed",
          "/pods",
          "/messages",
          "/notifications",
          "/settings",
          "/circles",
          "/mfa",
          "/suspended",
          "/unsubscribe",
          "/mentorship/dashboard",
          "/mentorship/checkout",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
