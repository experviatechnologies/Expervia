import { getSupabaseAdmin } from "@/lib/supabase";
import { sendConfirmationEmail } from "@/lib/eten/confirmation-email";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  isDisposableEmail,
  clientIp,
  checkRateLimit,
} from "@/lib/eten/spam-guard";
import { verifyTurnstile } from "@/lib/eten/turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  fullName?: string;
  email?: string;
  password?: string;
} & Record<string, unknown>;

/**
 * Creates a general ETEN account (the /join signup). Posts here instead of
 * calling supabase.auth.signUp client-side so the anti-spam guards run
 * server-side AND we send our own branded confirmation email via Resend (using
 * generateLink so Supabase doesn't also send its template). Mirrors the
 * mentorship register route; the trigger (migration 23) defaults signup_source
 * to 'eten' since we pass no mentorship metadata.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: a filled hidden field is a bot. Pretend success, create nothing.
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return Response.json({ ok: true });
  }

  const ip = clientIp(request.headers);
  if (
    !checkRateLimit(`eten-register:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
  ) {
    return Response.json(
      { error: "Too many attempts. Please try again in a little while." },
      { status: 429 },
    );
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (fullName.length < 2) {
    return Response.json(
      { error: "Please enter your full name." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (isDisposableEmail(email)) {
    return Response.json(
      { error: "Please register with a permanent email address." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  // Bot check (Cloudflare Turnstile). No-op until TURNSTILE_SECRET_KEY is set.
  const turnstileToken =
    typeof body.turnstileToken === "string" ? body.turnstileToken : null;
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return Response.json(
      {
        error: "Verification failed. Please complete the check and try again.",
      },
      { status: 400 },
    );
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!fromEmail) {
    return Response.json({ error: "Server not configured." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const next = "/dashboard";
  const admin = getSupabaseAdmin();

  // Create the account + a signup confirmation link WITHOUT Supabase sending the
  // email; we deliver it via Resend. The trigger defaults signup_source='eten'.
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: email.toLowerCase(),
    password,
    options: {
      data: { full_name: fullName },
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !link?.properties?.hashed_token) {
    const msg = (error?.message ?? "").toLowerCase();
    if (msg.includes("registered") || msg.includes("already")) {
      return Response.json(
        { error: "That email is already registered. Try signing in instead." },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "Couldn't create your account. Please try again." },
      { status: 500 },
    );
  }

  const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
    link.properties.hashed_token,
  )}&type=signup&next=${encodeURIComponent(next)}`;

  const mailError = await sendConfirmationEmail({
    to: email.toLowerCase(),
    name: fullName,
    url: confirmUrl,
    product: "eten",
  });
  if (mailError) {
    return Response.json(
      {
        error:
          "Account created, but the email failed to send. Contact support.",
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
