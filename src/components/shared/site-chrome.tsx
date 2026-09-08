"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ConsultFab } from "@/components/shared/consult-fab";

/**
 * Wraps page content with the public marketing chrome (navbar, footer, consult
 * FAB) and loads analytics — except on internal/app areas (the /admin console
 * and the ETEN member app + auth screens), which have their own bare layout and
 * are intentionally excluded from analytics tracking.
 */
const BARE_PREFIXES = [
  "/admin",
  "/dashboard",
  "/signin",
  "/join",
  "/auth",
  "/onboarding",
  "/profile",
  "/members",
  "/feed",
  "/pods",
  "/messages",
  "/notifications",
  "/forgot-password",
  "/reset-password",
  "/suspended",
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`),
  );

  if (isBare) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsultFab />
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-RD0N0P90EZ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-RD0N0P90EZ');`}
      </Script>
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "xii8dqvjcs");`}
      </Script>
    </>
  );
}
