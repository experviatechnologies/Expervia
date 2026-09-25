import "server-only";

/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Deliberately a no-op until TURNSTILE_SECRET_KEY is set, so this code is safe
 * to deploy before the Cloudflare/Supabase setup is done — verification simply
 * passes through, and starts enforcing the moment the secret is present.
 */
const SECRET = process.env.TURNSTILE_SECRET_KEY;

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Whether Turnstile is configured on the server. */
export function turnstileConfigured(): boolean {
  return Boolean(SECRET);
}

/**
 * Verifies a Turnstile token with Cloudflare. Returns true when Turnstile is
 * not configured (pass-through), or when the token is valid. Returns false for
 * a missing/invalid token once configured.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteip?: string,
): Promise<boolean> {
  if (!SECRET) return true; // not configured yet — don't block anyone
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.set("secret", SECRET);
    form.set("response", token);
    if (remoteip && remoteip !== "unknown") form.set("remoteip", remoteip);

    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
