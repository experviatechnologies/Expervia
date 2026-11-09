import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload, greetingFor } from "@/lib/email-template";
import { buildIcs } from "@/lib/tracker/ics";
import { siteConfig } from "@/config/site";

/**
 * Emails for key mentorship moments (requests, bookings, Circles, classes,
 * payments). Each caller describes the email; this module adds the greeting,
 * the session time in the recipient's own timezone, a calendar file when a
 * session is confirmed or cancelled, and sends it through the shared template.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;

// Base URL for the mentorship area: the subdomain when configured (it rewrites
// /x to /mentorship/x), else the path on the main site.
const MENTORSHIP_URL = process.env.NEXT_PUBLIC_MENTORSHIP_HOST
  ? `https://${process.env.NEXT_PUBLIC_MENTORSHIP_HOST}`
  : `${siteConfig.url}/mentorship`;

/** Absolute link to a page in the mentorship area, e.g. "/circles/<id>". */
export function mentorshipUrl(path: string): string {
  return `${MENTORSHIP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** "NGN 15,000.00" from an amount in minor units. Receipts use the code, not a symbol. */
export function formatMoney(minor: number, currency: string): string {
  return `${currency} ${(minor / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** A member's display name, for "Ada Obi requested a session". */
export async function memberName(
  admin: Admin,
  memberId: string | null | undefined,
  fallback = "A member",
): Promise<string> {
  if (!memberId) return fallback;
  const { data } = await admin
    .from("profiles")
    .select("full_name")
    .eq("member_id", memberId)
    .maybeSingle();
  const name = (data?.full_name as string | null | undefined)?.trim();
  if (name) return name;
  const { data: auth } = await admin.auth.admin.getUserById(memberId);
  const meta = auth?.user?.user_metadata?.full_name;
  return typeof meta === "string" && meta.trim() ? meta.trim() : fallback;
}

const DEFAULT_TZ = "Africa/Lagos";

export function validTimezone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * The recipient's timezone. Same order the rest of the app uses: a hint the
 * caller knows (a guest's booking timezone), the mentor scheduling timezone,
 * the presales profile timezone, then Lagos.
 */
async function recipientTimezone(
  admin: Admin,
  memberId: string,
  hint?: string | null,
): Promise<string> {
  if (validTimezone(hint)) return hint;
  const [{ data: prefs }, { data: presales }] = await Promise.all([
    admin
      .from("mentor_scheduling_prefs")
      .select("timezone")
      .eq("member_id", memberId)
      .maybeSingle(),
    admin
      .from("presales_profiles")
      .select("timezone")
      .eq("member_id", memberId)
      .maybeSingle(),
  ]);
  if (validTimezone(prefs?.timezone)) return prefs.timezone;
  if (validTimezone(presales?.timezone)) return presales.timezone;
  return DEFAULT_TZ;
}

/** "Monday 16 November, 14:00 (Lagos time, GMT+1)". */
export function formatWhen(iso: string, tz: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
  if (tz === "UTC" || tz === "Etc/UTC") return `${date}, ${time} (UTC)`;
  const offset =
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
  return `${date}, ${time} (${city} time${offset ? `, ${offset}` : ""})`;
}

export type MentorshipEmail = {
  subject: string;
  preview: string;
  paragraphs: string[];
  /** Key facts. "When" and "Length" are added automatically from `when`. */
  details?: { label: string; value: string }[];
  /** The session time, shown in the recipient's own timezone. */
  when?: { startsAt: string; minutes: number; timezoneHint?: string | null };
  /** Attach a calendar file for this session (needs `when`). */
  calendar?: { uid: string; title: string; cancelled?: boolean };
  cta: { label: string; path: string };
  smallPrint?: string[];
  reason: string;
};

/**
 * Best-effort: looks up the recipient, renders and sends. Never throws, so it
 * can't break the action that triggered it; no-ops if email isn't configured
 * or the recipient has no address.
 */
export async function sendMentorshipEmail(
  recipientId: string,
  email: MentorshipEmail,
): Promise<void> {
  try {
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    if (!fromEmail) return;
    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.admin.getUserById(recipientId);
    const to = data?.user?.email;
    if (!to) return;

    const url = mentorshipUrl(email.cta.path);
    const details = [...(email.details ?? [])];
    let attachments: {
      filename: string;
      content: string;
      contentType: string;
    }[] = [];
    if (email.when) {
      const tz = await recipientTimezone(
        admin,
        recipientId,
        email.when.timezoneHint,
      );
      details.unshift(
        { label: "When", value: formatWhen(email.when.startsAt, tz) },
        { label: "Length", value: `${email.when.minutes} minutes` },
      );
      if (email.calendar) {
        const start = new Date(email.when.startsAt);
        const end = new Date(start.getTime() + email.when.minutes * 60_000);
        const ics = buildIcs({
          app: "mentorship",
          uid: email.calendar.uid,
          method: email.calendar.cancelled ? "CANCEL" : "PUBLISH",
          start: start.toISOString(),
          end: end.toISOString(),
          summary: email.calendar.title,
          description: `Join from ETEN Mentorship: ${url}`,
          url,
        });
        attachments = [
          {
            filename: email.calendar.cancelled
              ? "cancelled.ics"
              : "session.ics",
            content: Buffer.from(ics).toString("base64"),
            contentType: `text/calendar; charset=UTF-8; method=${
              email.calendar.cancelled ? "CANCEL" : "PUBLISH"
            }`,
          },
        ];
      }
    }

    const fullName = data.user?.user_metadata?.full_name;
    const { error } = await getResendClient().emails.send({
      ...emailPayload({
        from: fromEmail,
        to,
        subject: email.subject,
        content: {
          brand: "mentorship",
          preview: email.preview,
          greeting: greetingFor(typeof fullName === "string" ? fullName : null),
          paragraphs: email.paragraphs,
          details,
          cta: { label: email.cta.label, url },
          smallPrint: email.smallPrint,
          reason: email.reason,
        },
      }),
      ...(attachments.length ? { attachments } : {}),
    });
    if (error) console.error("mentorship email failed", error.message);
  } catch (err) {
    console.error("mentorship email failed", err);
  }
}

export const MENTOR_REASON =
  "You're receiving this because you're a mentor on ETEN Mentorship.";
export const MENTEE_REASON =
  "You're receiving this because you use ETEN Mentorship.";
