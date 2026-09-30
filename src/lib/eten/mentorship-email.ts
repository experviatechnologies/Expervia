import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { siteConfig } from "@/config/site";

// Base URL for the mentorship area: the subdomain when configured, else the path
// on the main site. /dashboard resolves to the mentee dashboard (which routes
// mentors onward), so it works for both roles.
const MENTORSHIP_URL = process.env.NEXT_PUBLIC_MENTORSHIP_HOST
  ? `https://${process.env.NEXT_PUBLIC_MENTORSHIP_HOST}`
  : `${siteConfig.url}/mentorship`;

function emailHtml(heading: string, body: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:520px;margin:0 auto;">
      <h2 style="margin:0 0 12px;">${escapeHtml(heading)}</h2>
      <p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(body)}</p>
      <p style="margin:20px 0;">
        <a href="${MENTORSHIP_URL}/dashboard" style="background:#7c6cf0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Open ETEN Mentorship
        </a>
      </p>
      <p style="margin:16px 0 0;line-height:1.6;color:#666;font-size:13px;">
        You can manage notifications from your dashboard.
      </p>
    </div>
  `;
}

/**
 * Best-effort email for a key mentorship moment (new request, acceptance, added
 * to a Circle). Looks up the recipient's email and sends via Resend. Never
 * throws, so it can't break the action that triggered it; no-ops if email isn't
 * configured or the recipient has no address.
 */
export async function sendMentorshipEmail(
  recipientId: string,
  subject: string,
  heading: string,
  body: string,
): Promise<void> {
  try {
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    if (!fromEmail) return;
    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.admin.getUserById(recipientId);
    const to = data?.user?.email;
    if (!to) return;
    await getResendClient().emails.send({
      from: fromEmail,
      to,
      subject,
      html: emailHtml(heading, body),
    });
  } catch (err) {
    console.error("mentorship email failed", err);
  }
}
