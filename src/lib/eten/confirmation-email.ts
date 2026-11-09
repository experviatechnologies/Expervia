import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { siteConfig } from "@/config/site";

/**
 * Account confirmation emails for ETEN and ETEN Mentorship sign-ups
 * (delivered via Resend; this project does not use Supabase's SMTP).
 *
 * Written for inbox placement (9 Nov 2026, some Gmail users never saw them):
 * a hand-written plain-text part alongside the HTML, a Reply-To a person can
 * answer, the sender identified in the footer, the link also shown as text,
 * and no tracking or marketing language.
 */

export type Product = "eten" | "mentorship";

const NAME: Record<Product, string> = {
  eten: "ETEN",
  mentorship: "ETEN Mentorship",
};

export function confirmationEmail(params: {
  name: string;
  url: string;
  product: Product;
  intent?: "mentor" | "mentee";
}): { subject: string; html: string; text: string } {
  const first = params.name.trim().split(/\s+/)[0] || "there";
  const product = NAME[params.product];
  const why =
    params.product === "mentorship"
      ? `You signed up for ${product}${params.intent ? ` as a ${params.intent}` : ""}.`
      : "You signed up to join ETEN, the Expervia Technology Experts Network.";
  const subject = `Confirm your email for ${product}`;

  const text = [
    `Hi ${first},`,
    "",
    `${why} Please confirm your email address to activate your account:`,
    "",
    params.url,
    "",
    "The link works once and expires after a while. If it has expired, request a new one from the sign-in page.",
    "",
    "If you didn't sign up, ignore this email and no account will be activated.",
    "",
    "Expervia Technologies",
    siteConfig.url,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#ffffff;">
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1a1a2e;max-width:520px;margin:0 auto;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 16px;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 16px;">${escapeHtml(why)} Please confirm your email address to activate your account.</p>
    <p style="margin:24px 0;">
      <a href="${params.url}" style="background:#2e5395;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">Confirm my email</a>
    </p>
    <p style="margin:0 0 8px;color:#555;font-size:13px;">Or copy this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:13px;word-break:break-all;"><a href="${params.url}" style="color:#2e5395;">${escapeHtml(params.url)}</a></p>
    <p style="margin:0 0 16px;color:#555;font-size:13px;">The link works once and expires after a while. If you didn't sign up, ignore this email and no account will be activated.</p>
    <hr style="border:none;border-top:1px solid #e5e5ea;margin:24px 0 12px;" />
    <p style="margin:0;color:#777;font-size:12px;">Expervia Technologies · <a href="${siteConfig.url}" style="color:#777;">${escapeHtml(siteConfig.url.replace(/^https?:\/\//, ""))}</a></p>
  </div>
</body></html>`;

  return { subject, html, text };
}

/** Send a confirmation email. Returns an error message, or null when sent. */
export async function sendConfirmationEmail(params: {
  to: string;
  name: string;
  url: string;
  product: Product;
  intent?: "mentor" | "mentee";
}): Promise<string | null> {
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!from) return "Email isn't configured.";
  const { subject, html, text } = confirmationEmail(params);
  const replyTo = process.env.CONTACT_TO_EMAIL?.trim();
  const { error } = await getResendClient().emails.send({
    from,
    to: params.to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  return error ? error.message : null;
}

/** Where a confirmed member lands, by how they signed up. */
function nextFor(meta: Record<string, unknown>): string {
  if (meta.signup_source === "mentorship") {
    return meta.mentorship_intent === "mentor"
      ? "/mentorship/mentor"
      : "/mentorship/dashboard";
  }
  return "/dashboard";
}

/**
 * Send a fresh confirmation link to an account that signed up but never
 * confirmed. Uses a one-time sign-in (magic link) token: opening it confirms
 * the email and signs them in, without touching their password. Does nothing
 * for unknown or already-confirmed addresses (the caller always answers "sent"
 * so the form can't be used to find out who has an account).
 */
export async function resendConfirmation(
  email: string,
  origin: string,
): Promise<"sent" | "skipped" | "failed"> {
  const admin = getSupabaseAdmin();
  const target = email.trim().toLowerCase();
  let user: {
    email?: string;
    email_confirmed_at?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null = null;
  for (let page = 1; page < 50 && !user; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    user = users.find((u) => u.email?.toLowerCase() === target) ?? null;
    if (users.length < 1000) break;
  }
  if (!user || user.email_confirmed_at) return "skipped";

  const meta = user.user_metadata ?? {};
  const next = nextFor(meta);
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: target,
    options: {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !link?.properties?.hashed_token) return "failed";

  // Supabase says which kind of token it issued (for an unconfirmed account
  // it may be a signup confirmation rather than a magic link); verifying with
  // the wrong type fails, so pass on exactly what it reports.
  const type = link.properties.verification_type || "magiclink";
  const url = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
    link.properties.hashed_token,
  )}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;
  const sent = await sendConfirmationEmail({
    to: target,
    name: String(meta.full_name ?? ""),
    url,
    product: meta.signup_source === "mentorship" ? "mentorship" : "eten",
    intent:
      meta.mentorship_intent === "mentor" || meta.mentorship_intent === "mentee"
        ? meta.mentorship_intent
        : undefined,
  });
  return sent ? "failed" : "sent";
}
