/**
 * Thin wrapper around the site's Google Analytics (gtag, loaded by SiteChrome
 * on public pages). Safe to call anywhere on the client: it is a no-op when
 * gtag is not on the page (bare app routes, ad blockers, SSR).
 *
 * Never pass personal data (names, emails, free text) in `params`.
 */
type EventParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: EventParams) => void;
  }
}

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    // Analytics must never break the page.
  }
}
