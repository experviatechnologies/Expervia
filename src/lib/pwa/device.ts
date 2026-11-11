import type { AppPlatform } from "@/lib/pwa/actions";

/**
 * Browser checks for the installed-app features (install prompt, push).
 * Client-side only: they read navigator and window.
 */

export function isIos(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports itself as a Mac with a touch screen
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function platformOf(): AppPlatform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (isIos()) return "ios";
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return "desktop";
  return "other";
}

/** Opened from the home screen rather than a browser tab. */
export function isInstalledApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Facebook, Instagram, LinkedIn and similar in-app browsers. */
export function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Twitter|Line\//i.test(
    navigator.userAgent,
  );
}
