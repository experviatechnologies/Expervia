import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import {
  isDisposableEmail,
  clientIp,
  checkRateLimit,
} from "@/lib/eten/spam-guard";
import { verifyTurnstile } from "@/lib/eten/turnstile";

function confirmEmailHtml(fullName: string, confirmUrl: string): string {
  const first = escapeHtml(fullName.split(/\s+/)[0] || "there");
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:520px;margin:0 auto;">
      <h2 style="margin:0 0 12px;">Confirm your ETEN Mentorship account</h2>
      <p style="margin:0 0 12px;line-height:1.6;">Hi ${first},</p>
      <p style="margin:0 0 12px;line-height:1.6;">
        Thanks for joining ETEN Mentorship. Confirm your email to activate your
        account and set up your goal.
      </p>
      <p style="margin:24px 0;">
        <a href="${confirmUrl}" style="background:#7c6cf0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Confirm my account
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;color:#666;font-size:13px;">
        This link is single-use and expires soon. If you didn't create this
        account, you can ignore this email.
      </p>
    </div>
  `;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  fullName?: string;
  email?: string;
  password?: string;
  intent?: string;
  capabilityArea?: string;
} & Record<string, unknown>;

/**
 * Creates a mentorship Prospect account. The register form posts here (rather
 * than calling signUp directly) so the anti-spam guards run server-side before
 * an account is created. On success Supabase sends the confirmation email; the
 * auth trigger (migration 23) writes signup_source / intent / capability area
 * onto the members row with validated_at null (Prospect).
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
    !checkRateLimit(`mnt-register:${ip}`, {
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
  const intent = body.intent === "mentor" ? "mentor" : "mentee";
  const capabilityArea = body.capabilityArea?.trim() ?? "";

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
  const next =
    intent === "mentor" ? "/mentorship/mentor" : "/mentorship/dashboard";
  const admin = getSupabaseAdmin();

  // Create the account + a signup confirmation link WITHOUT Supabase sending
  // the email (this project delivers auth emails via Resend, not Supabase's
  // built-in SMTP). The trigger reads the metadata onto the members row.
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: email.toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName,
        signup_source: "mentorship",
        mentorship_intent: intent,
        mentorship_capability_area: capabilityArea,
      },
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

  const { error: mailError } = await getResendClient().emails.send({
    from: fromEmail,
    to: email.toLowerCase(),
    subject: "Confirm your ETEN Mentorship account",
    html: confirmEmailHtml(fullName, confirmUrl),
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
