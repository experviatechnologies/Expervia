import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { emailPayload, greetingFor } from "@/lib/email-template";
import { formatWhen, validTimezone } from "@/lib/eten/mentorship-email";

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
    const tz =
      booking.guest_timezone && validTimezone(booking.guest_timezone)
        ? booking.guest_timezone
        : "Africa/Lagos";

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

    await getResendClient().emails.send(
      emailPayload({
        from: fromEmail,
        to,
        subject: `Your sign-in link for your session with ${mentorName}`,
        content: {
          brand: "mentorship",
          preview:
            "No password needed. Join, reschedule or manage your booking.",
          greeting: greetingFor(userRes?.user?.user_metadata?.full_name),
          paragraphs: [
            `Your session with ${mentorName} is booked, and we've set up an ETEN Mentorship account for you to manage it.`,
            "Use the button below to sign in, no password needed. From your account you can join the video session, see your booking and reschedule.",
          ],
          details: [
            { label: "Mentor", value: mentorName },
            { label: "When", value: formatWhen(booking.starts_at, tz) },
            { label: "Length", value: `${booking.duration_minutes} minutes` },
          ],
          cta: { label: "Sign in to my session", url: accessUrl },
          smallPrint: [
            'This sign-in link works once and expires after a short time. If it has expired, choose "Forgot password" on the ETEN Mentorship sign-in page to get back in.',
            "You can reschedule for free up to 24 hours before the session.",
          ],
          reason:
            "You're receiving this because you booked a session on ETEN Mentorship.",
        },
      }),
    );
  } catch (err) {
    console.error("guest booking welcome email failed", err);
  }
}
