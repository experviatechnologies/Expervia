import { siteConfig } from "@/config/site";

/**
 * The tracker's own address (Phase 9, step 9.1), e.g.
 * "presales.experviatechnologies.com". When NEXT_PUBLIC_TRACKER_HOST is set,
 * that host serves the tracker at its root ("/dashboard" is the tracker's
 * dashboard) through a rewrite in next.config.ts; the code stays under
 * /tracker. Unset, everything keeps working at /tracker on the main site.
 */
export const TRACKER_HOST = process.env.NEXT_PUBLIC_TRACKER_HOST || null;

/** "/tracker/requests/x" -> "/requests/x" (and "/tracker" -> "/"). */
export function stripTrackerPrefix(path: string): string {
  const rest = path.replace(/^\/tracker(?=\/|\?|$)/, "");
  return rest === "" || rest.startsWith("?") ? `/${rest}` : rest;
}

/**
 * Absolute link to a tracker page for emails and calendar events: on the
 * tracker's own address when it is set, otherwise on the main site.
 */
export function trackerUrl(path: string): string {
  return TRACKER_HOST
    ? `https://${TRACKER_HOST}${stripTrackerPrefix(path)}`
    : `${siteConfig.url}${path}`;
}
