import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  sendEmail,
  greetingFor,
  type EmailContent,
} from "@/lib/email-template";

/**
 * Account confirmation emails for ETEN and ETEN Mentorship sign-ups
 * (delivered via Resend; this project does not use Supabase's SMTP).
 *
 * Uses the shared email template (plain-text part, Reply-To, footer), which
 * came out of the 9 Nov 2026 incident where some Gmail users never saw them.
 */

export type Product = "eten" | "mentorship";

/** Copy for the confirmation email, by product and (for mentorship) role. */
export function confirmationEmail(params: {
  name: string;
  url: string;
  product: Product;
  intent?: "mentor" | "mentee";
}): { subject: string; content: EmailContent } {
  const mentorship = params.product === "mentorship";
  const intro = mentorship
    ? `Thanks for signing up to ETEN Mentorship${params.intent ? ` as a ${params.intent}` : ""}. Confirm your email address and your account will be ready.`
    : "Thanks for signing up to ETEN, the Expervia Technology Experts Network. Confirm your email address and your account will be ready.";
  const next =
    params.intent === "mentor"
      ? "Next, you'll set up your mentor profile so mentees can find you."
      : params.intent === "mentee"
        ? "Next, you'll be able to browse mentors and book your first session."
        : "Next, you'll complete your member details so your Pod Leader can reach you.";

  return {
    subject: mentorship
      ? "Confirm your email for ETEN Mentorship"
      : "Confirm your email to join ETEN",
    content: {
      brand: mentorship ? "mentorship" : "eten",
      preview: "One click and your account is active.",
      greeting: greetingFor(params.name),
      paragraphs: [intro, next],
      cta: { label: "Confirm my email", url: params.url },
      showLink: true,
      smallPrint: [
        'For your security, this link works once and expires after a short time. If it has expired, go to the sign-in page and choose "Resend the confirmation email".',
        "Didn't sign up? You can ignore this email. No account will be activated.",
      ],
      reason: `You're receiving this because this address was used to sign up for ${mentorship ? "ETEN Mentorship" : "ETEN"}.`,
    },
  };
}

/** Send a confirmation email. Returns an error message, or null when sent. */
export async function sendConfirmationEmail(params: {
  to: string;
  name: string;
  url: string;
  product: Product;
  intent?: "mentor" | "mentee";
}): Promise<string | null> {
  const { subject, content } = confirmationEmail(params);
  return sendEmail({ to: params.to, subject, content });
}

export type AuthUserSummary = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

/**
 * The auth account for an email address, or null. Pages through the users
 * (Supabase has no lookup by email in the admin API); fine at ETEN's size.
 */
export async function findAuthUserByEmail(
  email: string,
): Promise<AuthUserSummary | null> {
  const admin = getSupabaseAdmin();
  const target = email.trim().toLowerCase();
  for (let page = 1; page < 50; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (users.length < 1000) break;
  }
  return null;
}

/** Where a confirmed member lands, by how they signed up. */
export function nextFor(meta: Record<string, unknown>): string {
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
  const user = await findAuthUserByEmail(target);
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
