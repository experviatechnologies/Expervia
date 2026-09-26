import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import { SiteChrome } from "@/components/shared/site-chrome";
import { siteConfig } from "@/config/site";

// Self-hosted (not next/font/google): the fonts are stored in ./fonts and
// bundled at build, so the build never fetches from Google — which was failing
// on the Vercel build (NextFontGoogleFontFileReplacer). These are the latin
// variable subsets, so a single file per family covers its whole weight range.
const manrope = localFont({
  src: "./fonts/Manrope.woff2",
  variable: "--font-manrope",
  weight: "600 800",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-inter",
  weight: "400 600",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-jetbrains",
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Powering Africa's Intelligent Enterprise`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  verification: {
    google: "VI-FqcZRWPYzb5mSlU3lPukiPwTf7382IhNXSX_pkqA",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The mentorship subdomain serves its pages at the root via a host rewrite, so
  // it must not get the Expervia marketing navbar/footer. Decide from the actual
  // request host (client-side host checks would flash the navbar on first paint).
  const mentorshipHost = process.env.NEXT_PUBLIC_MENTORSHIP_HOST;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const isMentorshipHost = Boolean(mentorshipHost) && host === mentorshipHost;

  return (
    <html
      lang="en"
      className={`dark ${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-surface text-on-surface flex min-h-full flex-col">
        <SiteChrome forceBare={isMentorshipHost}>{children}</SiteChrome>
      </body>
    </html>
  );
}
