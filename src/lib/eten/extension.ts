import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import {
  sendMentorshipEmail,
  memberName,
  formatMoney,
} from "@/lib/eten/mentorship-email";

type Admin = ReturnType<typeof getSupabaseAdmin>;

/**
 * Activate a paid session extension (Monetization M-4). Called only after a
 * payment is backend-verified. Idempotent and race-safe: the pending -> active
 * flip is an atomic conditional update, so the session minutes are added exactly
 * once even if the webhook and the return page both settle the same charge.
 */
export async function activateExtension(
  admin: Admin,
  extensionId: string,
): Promise<void> {
  // Atomically claim the extension. Only the writer that flips pending -> active
  // gets the row back and goes on to add the minutes.
  const { data: claimed } = await admin
    .from("session_extensions")
    .update({ status: "active", activated_at: new Date().toISOString() })
    .eq("id", extensionId)
    .eq("status", "pending")
    .select(
      "session_id, minutes, mentor_id, mentee_id, amount, currency, payment_id",
    )
    .maybeSingle();
  if (!claimed) return; // already active/cancelled, or gone: nothing to do

  const { data: session } = await admin
    .from("circle_sessions")
    .select("duration_minutes, circle_id, starts_at")
    .eq("id", claimed.session_id)
    .maybeSingle();
  if (!session) return;

  const newMinutes = (session.duration_minutes ?? 40) + claimed.minutes;
  await admin
    .from("circle_sessions")
    .update({
      duration_minutes: newMinutes,
    })
    .eq("id", claimed.session_id);

  await notify({
    recipientId: claimed.mentor_id,
    actorId: claimed.mentee_id,
    type: "mentorship",
    targetType: "extension_paid",
    targetId: claimed.session_id,
  });
  const [mentorName, { data: payment }] = await Promise.all([
    memberName(admin, claimed.mentor_id, "your mentor"),
    claimed.payment_id
      ? admin
          .from("payments")
          .select("reference")
          .eq("id", claimed.payment_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  await sendMentorshipEmail(claimed.mentee_id, {
    subject: `Your session was extended by ${claimed.minutes} minutes`,
    preview: "Payment received. Head back to the room to continue.",
    paragraphs: [
      `Your payment went through and your session with ${mentorName} now has ${claimed.minutes} extra minutes. Head back to the room to continue.`,
    ],
    details: [
      { label: "Extra time", value: `${claimed.minutes} minutes` },
      { label: "Paid", value: formatMoney(claimed.amount, claimed.currency) },
      ...(payment?.reference
        ? [{ label: "Payment reference", value: payment.reference }]
        : []),
    ],
    ...(session.starts_at
      ? {
          when: { startsAt: session.starts_at, minutes: newMinutes },
          calendar: {
            uid: `session-${claimed.session_id}`,
            title: `Mentorship session with ${mentorName}`,
          },
        }
      : {}),
    cta: {
      label: "Back to the session",
      path: `/circles/${session.circle_id}/class/${claimed.session_id}`,
    },
    smallPrint: ["Keep this email as your receipt."],
    reason:
      "You're receiving this because you made a payment on ETEN Mentorship.",
  });
}
