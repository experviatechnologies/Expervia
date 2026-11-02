import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";
import { siteConfig } from "@/config/site";

/**
 * Presales tracker emails (PRD section 10: in-app and email in Version 1).
 * Best-effort like the mentorship emails: looks up each recipient's address,
 * sends via Resend, never throws, and no-ops when email isn't configured.
 */

function emailHtml(
  heading: string,
  body: string,
  href: string,
  cta: string,
): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#17123d;max-width:540px;margin:0 auto;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6e6a8c;">ETEN Availability Tracker</p>
      <h2 style="margin:0 0 12px;">${escapeHtml(heading)}</h2>
      <p style="margin:0 0 16px;line-height:1.6;white-space:pre-line;">${escapeHtml(body)}</p>
      <p style="margin:20px 0;">
        <a href="${href}" style="background:#4a16c4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block;">
          ${escapeHtml(cta)}
        </a>
      </p>
      <p style="margin:16px 0 0;line-height:1.6;color:#6e6a8c;font-size:13px;">
        You receive this because of your role in the Expervia Technology Experts Network.
      </p>
    </div>
  `;
}

export async function sendTrackerEmail(params: {
  recipientIds: (string | null | undefined)[];
  subject: string;
  heading: string;
  body: string;
  /** Path inside the site, e.g. /tracker/requests/<id>. */
  path: string;
  cta?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}): Promise<void> {
  try {
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    if (!fromEmail) return;
    const admin = getSupabaseAdmin();
    const ids = Array.from(
      new Set(params.recipientIds.filter(Boolean)),
    ) as string[];
    const resend = getResendClient();
    const href = `${siteConfig.url}${params.path}`;
    await Promise.all(
      ids.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        const to = data?.user?.email;
        if (!to) return;
        const { error } = await resend.emails.send({
          from: fromEmail,
          to,
          subject: params.subject,
          html: emailHtml(
            params.heading,
            params.body,
            href,
            params.cta ?? "Open the tracker",
          ),
          attachments: params.attachments?.map((a) => ({
            filename: a.filename,
            content: Buffer.from(a.content).toString("base64"),
            contentType: a.contentType,
          })),
        });
        if (error) console.error("tracker email failed", error.message);
      }),
    );
  } catch (err) {
    console.error("tracker email failed", err);
  }
}
