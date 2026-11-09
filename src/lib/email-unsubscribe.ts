import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { siteConfig } from "@/config/site";

/**
 * Unsubscribe links for admin broadcasts. Each link carries the address and a
 * signature, so nobody can unsubscribe someone else by editing the URL. Signed
 * with EMAIL_UNSUBSCRIBE_SECRET, falling back to the service role key (both
 * server-only). Unsubscribes are stored in public.email_unsubscribes.
 */

function secret(): string {
  const s =
    process.env.EMAIL_UNSUBSCRIBE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("No secret for unsubscribe links.");
  return s;
}

function sign(email: string): string {
  return createHmac("sha256", secret())
    .update(`unsubscribe:${email.toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyUnsubscribe(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function query(email: string) {
  const e = email.toLowerCase();
  return `e=${encodeURIComponent(e)}&t=${sign(e)}`;
}

/** The page a person opens from the footer link (asks them to confirm). */
export function unsubscribePageUrl(email: string): string {
  return `${siteConfig.url}/unsubscribe?${query(email)}`;
}

/** The endpoint inbox providers POST to for one-click unsubscribe (RFC 8058). */
export function unsubscribeOneClickUrl(email: string): string {
  return `${siteConfig.url}/api/email/unsubscribe?${query(email)}`;
}

/** Record an unsubscribe. Returns false if it couldn't be saved. */
export async function recordUnsubscribe(
  email: string,
  source: "link" | "one_click",
): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from("email_unsubscribes")
    .upsert(
      { email: email.toLowerCase(), source },
      { onConflict: "email", ignoreDuplicates: true },
    );
  if (error) console.error("unsubscribe failed", error.message);
  return !error;
}

/** Every unsubscribed address (lower case). Empty if the table isn't there yet. */
export async function loadUnsubscribed(): Promise<Set<string>> {
  const out = new Set<string>();
  const admin = getSupabaseAdmin();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("email_unsubscribes")
      .select("email")
      .range(from, from + 999);
    if (error) {
      console.error("loading unsubscribes failed", error.message);
      break;
    }
    for (const r of data ?? []) out.add(r.email);
    if (!data || data.length < 1000) break;
  }
  return out;
}
