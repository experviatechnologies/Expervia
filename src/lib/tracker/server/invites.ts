import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTrackerEmail } from "./email";
import { buildIcs } from "@/lib/tracker/ics";
import { fmtRange } from "@/lib/tracker/time";
import { siteConfig } from "@/config/site";

type Admin = ReturnType<typeof getSupabaseAdmin>;

/** The fields of a presales request an invite needs. */
export type InviteRequest = {
  id: string;
  ref: string;
  title: string;
  client: string;
  objective: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  format: string;
  location: string | null;
  platform: string | null;
  join_link: string | null;
  prep_notes: string | null;
};

const organizer = () =>
  process.env.CONTACT_FROM_EMAIL?.match(/[^<\s]+@[^>\s]+/)?.[0];

async function memberEmails(admin: Admin, ids: string[]) {
  const out = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) out.set(id, data.user.email);
    }),
  );
  return out;
}

/**
 * Email each participant their own calendar file (one UID per seat, so a
 * later update or cancellation replaces the same event).
 */
export async function sendInvites(
  admin: Admin,
  req: InviteRequest,
  seats: { member_id: string; idempotency_key: string }[],
  method: "REQUEST" | "CANCEL",
) {
  const emails = await memberEmails(
    admin,
    seats.map((s) => s.member_id),
  );
  const where =
    req.format === "online"
      ? [req.platform, req.join_link].filter(Boolean).join(" ")
      : ((req.location as string) ?? "");
  const url = `${siteConfig.url}/tracker/requests/${req.id}`;
  for (const s of seats) {
    if (!emails.has(s.member_id)) continue;
    const ics = buildIcs({
      uid: s.idempotency_key,
      method,
      start: req.starts_at,
      end: req.ends_at,
      summary: `${req.title} (${req.ref})`,
      description: [
        `Client: ${req.client}`,
        req.objective,
        req.prep_notes ? `Preparation: ${req.prep_notes}` : "",
        url,
      ]
        .filter(Boolean)
        .join("\n"),
      location: where || undefined,
      url,
      organizerEmail: organizer(),
    });
    await sendTrackerEmail({
      recipientIds: [s.member_id],
      subject:
        method === "CANCEL"
          ? `Cancelled: ${req.title} (${req.ref})`
          : `Confirmed: ${req.title} (${req.ref})`,
      heading:
        method === "CANCEL"
          ? `Cancelled: ${req.title}`
          : `Confirmed: ${req.title}`,
      body:
        method === "CANCEL"
          ? `${req.ref} has been cancelled. The attached file removes it from your calendar.`
          : `${fmtRange(req.starts_at, req.ends_at, req.timezone)}\n${where}\nOpen the attached invite to add it to your calendar.`,
      path: `/tracker/requests/${req.id}`,
      cta: "Open the meeting",
      attachments: [
        {
          filename: method === "CANCEL" ? "cancelled.ics" : "invite.ics",
          content: ics,
          contentType: `text/calendar; method=${method}; charset=UTF-8`,
        },
      ],
    });
  }
}
