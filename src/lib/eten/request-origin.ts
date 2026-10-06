import { headers } from "next/headers";

/**
 * Absolute origin of the current request, for building callback URLs (e.g. the
 * Paystack return URL). Respects the forwarded host/proto set by the proxy so it
 * works on the mentorship subdomain.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
