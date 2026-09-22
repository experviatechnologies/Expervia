import "server-only";

/**
 * Server-side abuse controls for the public forms (event registration, and any
 * other unauthenticated POST). Three cheap, dependency-free layers:
 *   - honeypot (checked in the route via HONEYPOT_FIELD),
 *   - disposable / throwaway email domain blocking (isDisposableEmail),
 *   - a best-effort per-IP rate limit (checkRateLimit).
 *
 * NOTE on the rate limit: it's an in-memory sliding window, so on serverless it
 * only sees requests that hit the same warm instance and resets on cold start.
 * That still stops naive floods, but the durable bot defence is the Turnstile
 * CAPTCHA (added separately). Treat this as a first, free layer — not the wall.
 */

// Common disposable / throwaway providers. Not exhaustive — extend as new ones
// show up in the registrations. Compared against the lower-cased domain.
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "tempmailo.com",
  "tempr.email",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "getnada.com",
  "nada.email",
  "dispostable.com",
  "mailnesia.com",
  "mintemail.com",
  "throwawaymail.com",
  "throwawaymail.net",
  "fakeinbox.com",
  "maildrop.cc",
  "mohmal.com",
  "emailondeck.com",
  "spam4.me",
  "moakt.com",
  "mytemp.email",
  "discard.email",
  "mailcatch.com",
  "inboxbear.com",
  "spambox.us",
  "tempinbox.com",
  "burnermail.io",
  "einrot.com",
  "fakemail.net",
  "trbvm.com",
  "harakirimail.com",
  "cs.email",
  "byom.de",
]);

/** True if the address uses a known disposable / throwaway domain. */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/** The caller's IP, from the platform's forwarding headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

const hits = new Map<string, number[]>();

/**
 * Best-effort sliding-window rate limit. Returns true if the call is allowed,
 * false once `limit` calls have happened for `key` within `windowMs`.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}
