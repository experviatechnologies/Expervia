import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload } from "@/lib/email-template";
import { resetPasswordEmail } from "@/lib/eten/account-emails";
import { HONEYPOT_FIELD } from "@/lib/eten/honeypot";
import { clientIp, checkRateLimit } from "@/lib/eten/spam-guard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_NEXT = "/reset-password";

type Body = { email?: string } & Record<string, unknown>;

/**
 * Sends a password-reset link for a member account. The forgot-password form
 * posts here. The email is delivered via Resend (not Supabase's built-in SMTP,
 * which this project doesn't use): we generateLink({ type: "recovery" }) and
 * email the /auth/confirm link ourselves.
 *
 * To avoid account enumeration, the response is always { ok: true } whether or
 * not the address has an account and whether or not sending succeeds. Only a
 * server misconfiguration or a rate-limit trip returns an error.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: a filled hidden field is a bot. Pretend success, do nothing.
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return Response.json({ ok: true });
  }

  const ip = clientIp(request.headers);
  if (!checkRateLimit(`forgot:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })) {
    return Response.json(
      { error: "Too many attempts. Please try again in a little while." },
      { status: 429 },
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!fromEmail) {
    return Response.json({ error: "Server not configured." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const admin = getSupabaseAdmin();

  // Generate a recovery link without Supabase sending the email. If the address
  // has no account, this errors — we swallow it and still report success so the
  // response can't be used to tell which emails are registered.
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (!error && link?.properties?.hashed_token) {
    const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
      link.properties.hashed_token,
    )}&type=recovery&next=${encodeURIComponent(RESET_NEXT)}`;
    // A send failure is swallowed too, for the same anti-enumeration reason.
    const { subject, content } = resetPasswordEmail(
      "eten",
      link.user?.user_metadata?.full_name,
      email,
      confirmUrl,
    );
    await getResendClient()
      .emails.send(
        emailPayload({ from: fromEmail, to: email, subject, content }),
      )
      .catch(() => {});
  }

  return Response.json({ ok: true });
}
