import { siteConfig } from "@/config/site";

/**
 * The CRM's own address, e.g. "crm.experviatechnologies.com". When
 * NEXT_PUBLIC_CRM_HOST is set, that host serves the CRM at its root ("/" is
 * the dashboard, "/contacts" is Contacts) through a rewrite in
 * next.config.ts, and /crm on the main site moves there. The /crm/... paths
 * the screens link to keep working on that host too, so no click needs a
 * redirect. Unset, everything stays at /crm on the main site.
 */
export const CRM_HOST = process.env.NEXT_PUBLIC_CRM_HOST || null;

/** Clean CRM paths that only exist on the CRM's address. */
export const CRM_ONLY = [
  "/contacts",
  "/companies",
  "/deals",
  "/tasks",
  "/lists",
  "/campaigns",
  "/review",
  "/activation",
];

/** Clean CRM paths that also exist elsewhere (tracker reports, public page). */
export const CRM_SHARED_NAMES = ["/reports", "/women-in-tech"];

/** "/crm/contacts/x" -> "/contacts/x" (and "/crm" -> "/"). */
export function stripCrmPrefix(path: string): string {
  const rest = path.replace(/^\/crm(?=\/|\?|$)/, "");
  return rest === "" || rest.startsWith("?") ? `/${rest}` : rest;
}

/** Absolute link to a CRM page, on the CRM's address when it is set. */
export function crmUrl(path: string): string {
  return CRM_HOST
    ? `https://${CRM_HOST}${stripCrmPrefix(path)}`
    : `${siteConfig.url}${path}`;
}

/**
 * A main-site page linked from the CRM (admin console, member dashboard,
 * public pages). On the CRM's own address a bare "/admin" would mean a CRM
 * page, so there it becomes the main site's full address; elsewhere
 * (main site, previews, local) it stays relative.
 */
export function mainSiteUrl(path: string): string {
  return CRM_HOST ? `${siteConfig.url}${path}` : path;
}
