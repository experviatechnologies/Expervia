import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { clientIp, checkRateLimit } from "@/lib/eten/spam-guard";
import { sendSignInCode } from "@/lib/eten/sign-in-code";

/**
 * POST { email, next } — email a one-time sign-in code (and link) to an
 * existing account. Used by "Email me a sign-in code" on the sign-in page.
 *
 * Always answers { ok: true } for a well-formed request, whether or not the
 * address has an account, so it can't be used to find out who is a member.
 * Rate-limited per visitor and per address; a filled hidden field is a bot.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW = 15 * 60 * 1000;

export async function POST(request: Request) {
  let body: { email?: string; next?: string } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return Response.json({ ok: true });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const ip = clientIp(request.headers);
  if (
    !checkRateLimit(`signin-code:${ip}`, { limit: 5, windowMs: WINDOW }) ||
    !checkRateLimit(`signin-code:${email}`, { limit: 3, windowMs: WINDOW })
  ) {
    return Response.json(
      { error: "Too many codes requested. Please wait a few minutes." },
      { status: 429 },
    );
  }

  if (!process.env.CONTACT_FROM_EMAIL) {
    return Response.json({ error: "Server not configured." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const result = await sendSignInCode(
    email,
    origin,
    typeof body.next === "string" ? body.next : "/dashboard",
  );
  if (result === "failed") console.error("sign-in code failed for a request");
  return Response.json({ ok: true });
}
