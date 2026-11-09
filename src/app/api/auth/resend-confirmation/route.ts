import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { checkRateLimit, clientIp } from "@/lib/eten/spam-guard";
import { resendConfirmation } from "@/lib/eten/confirmation-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Resend the confirmation email" for people who signed up but never found
 * the first one (9 Nov 2026). Rate-limited per IP and per address, guarded by
 * the honeypot, and always answers ok, so it can't reveal which addresses
 * have accounts.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD]) {
    return Response.json({ ok: true });
  }
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const ip = clientIp(request.headers);
  if (
    !checkRateLimit(`resend-confirm-ip:${ip}`, {
      limit: 6,
      windowMs: 15 * 60_000,
    }) ||
    !checkRateLimit(`resend-confirm-email:${email}`, {
      limit: 3,
      windowMs: 60 * 60_000,
    })
  ) {
    return Response.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const result = await resendConfirmation(email, new URL(request.url).origin);
  if (result === "failed") {
    return Response.json(
      {
        error: "We couldn't send the email just now. Please try again shortly.",
      },
      { status: 502 },
    );
  }
  return Response.json({ ok: true });
}
