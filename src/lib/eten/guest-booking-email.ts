import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient, escapeHtml } from "@/lib/email";

/**
 * After a guest's payment settles, email them a confirmation with the session
 * details and a one-click link to access their (behind-the-scenes) ETEN account.
 * Deduped via session_bookings.guest_welcome_sent_at, so a refresh of the return
 * page never re-sends. Best-effort: never throws, so it can't break the return
 * page's settlement.
 */
export async function sendGuestBookingWelcome(
  origin: string,
  bookingId: string,
): Promise<void> {
  try {
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    if (!fromEmail) return;

    const admin = getSupabaseAdmin();

    const { data: booking } = await admin
      .from("session_bookings")
      .select(
        "id, mentor_id, mentee_id, starts_at, duration_minutes, session_type, status, guest_timezone, guest_welcome_sent_at",
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking || booking.guest_welcome_sent_at) return;
    if (booking.status !== "accepted") return;

    // Claim the send first (dedupe). If this update touches no row because
    // another request beat us to it, stop.
    const { data: claimed } = await admin
      .from("session_bookings")
      .update({ guest_welcome_sent_at: new Date().toISOString() })
      .eq("id", bookingId)
      .is("guest_welcome_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return;

    const { data: userRes } = await admin.auth.admin.getUserById(
      booking.mentee_id,
    );
    const to = userRes?.user?.email;
    if (!to) return;

    const { data: mentorProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("member_id", booking.mentor_id)
      .maybeSingle();
    const mentorName = mentorProfile?.full_name ?? "your mentor";

    const tz = booking.guest_timezone || "UTC";
    let whenLabel: string;
    try {
      whenLabel =
        new Date(booking.starts_at).toLocaleString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        }) + ` (${tz.split("/").pop()?.replace(/_/g, " ") ?? tz})`;
    } catch {
      whenLabel = new Date(booking.starts_at).toUTCString();
    }

    // A magic link that signs them in and lands on their mentorship dashboard,
    // handled by the shared /auth/confirm route (stamps claimed_at on first use).
    let accessUrl = `${origin}/mentorship/dashboard`;
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: to,
    });
    const tokenHash = link.data?.properties?.hashed_token;
    if (!link.error && tokenHash) {
      accessUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
        tokenHash,
      )}&type=magiclink&next=${encodeURIComponent("/mentorship/dashboard")}`;
    }

    await getResendClient().emails.send({
      from: fromEmail,
      to,
      subject: `You're booked with ${mentorName}`,
      html: welcomeHtml({
        mentorName,
        whenLabel,
        minutes: booking.duration_minutes,
        accessUrl,
      }),
    });
  } catch (err) {
    console.error("guest booking welcome email failed", err);
  }
}

function welcomeHtml(input: {
  mentorName: string;
  whenLabel: string;
  minutes: number;
  accessUrl: string;
}): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#17123D;max-width:520px;margin:0 auto;">
      <h2 style="margin:0 0 12px;">You're booked</h2>
      <p style="margin:0 0 12px;line-height:1.6;">
        Your session with <strong>${escapeHtml(input.mentorName)}</strong> is
        confirmed.
      </p>
      <div style="margin:0 0 16px;padding:14px 16px;background:#F7F5FD;border-radius:12px;line-height:1.6;">
        <div style="font-weight:700;">${escapeHtml(input.whenLabel)}</div>
        <div style="color:#5E5A7D;font-size:14px;">${input.minutes} minute session · joined on video</div>
      </div>
      <p style="margin:0 0 12px;line-height:1.6;">
        We've set up an ETEN account for you so you can join the session, see the
        video link and manage your booking. Use the button below to sign in, no
        password needed.
      </p>
      <p style="margin:20px 0;">
        <a href="${input.accessUrl}" style="background:#4A16C4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Open your session
        </a>
      </p>
      <p style="margin:16px 0 0;line-height:1.6;color:#6E6A8C;font-size:13px;">
        You can reschedule for free up to 24 hours before the session. This
        sign-in link is single-use and expires soon.
      </p>
    </div>
  `;
}
