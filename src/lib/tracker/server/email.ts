import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload } from "@/lib/email-template";
import { siteConfig } from "@/config/site";
import { trackerUrl } from "@/lib/tracker/host";

/**
 * Presales tracker emails (PRD section 10: in-app and email in Version 1).
 * Best-effort like the mentorship emails: looks up each recipient's address,
 * sends via Resend, never throws, and no-ops when email isn't configured.
 */

/**
 * Record an email that couldn't be sent, for the admin health view
 * (Phase 7, step 7.2). Never throws.
 */
async function logEmailFailure(
  recipientId: string,
  subject: string,
  error: string,
) {
  try {
    await getSupabaseAdmin()
      .from("presales_job_runs")
      .insert({
        job: "email",
        status: "failed",
        finished_at: new Date().toISOString(),
        details: { recipient_id: recipientId, subject },
        error: error.slice(0, 1000),
      });
  } catch (err) {
    console.error("logging email failure failed", err);
  }
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
    // Tracker pages link to the tracker's own address when it is set.
    const href = params.path.startsWith("/tracker")
      ? trackerUrl(params.path)
      : `${siteConfig.url}${params.path}`;
    await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await admin.auth.admin.getUserById(id);
          const to = data?.user?.email;
          if (!to) return;
          const { error } = await resend.emails.send({
            ...emailPayload({
              from: fromEmail,
              to,
              subject: params.subject,
              content: {
                brand: "tracker",
                heading: params.heading,
                preview: params.body.split("\n")[0] ?? "",
                paragraphs: [params.body],
                cta: { label: params.cta ?? "Open the tracker", url: href },
                reason:
                  "You're receiving this because of your role in the Expervia Technology Experts Network.",
              },
            }),
            attachments: params.attachments?.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content).toString("base64"),
              contentType: a.contentType,
            })),
          });
          if (error) {
            console.error("tracker email failed", error.message);
            await logEmailFailure(id, params.subject, error.message);
          }
        } catch (err) {
          await logEmailFailure(
            id,
            params.subject,
            err instanceof Error ? err.message : String(err),
          );
        }
      }),
    );
  } catch (err) {
    console.error("tracker email failed", err);
  }
}
