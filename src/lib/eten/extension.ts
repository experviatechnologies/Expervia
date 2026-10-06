import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";

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
    .select("session_id, minutes, mentor_id, mentee_id")
    .maybeSingle();
  if (!claimed) return; // already active/cancelled, or gone: nothing to do

  const { data: session } = await admin
    .from("circle_sessions")
    .select("duration_minutes")
    .eq("id", claimed.session_id)
    .maybeSingle();
  if (!session) return;

  await admin
    .from("circle_sessions")
    .update({
      duration_minutes: (session.duration_minutes ?? 40) + claimed.minutes,
    })
    .eq("id", claimed.session_id);

  await notify({
    recipientId: claimed.mentor_id,
    actorId: claimed.mentee_id,
    type: "mentorship",
    targetType: "extension_paid",
    targetId: claimed.session_id,
  });
  await sendMentorshipEmail(
    claimed.mentee_id,
    "Your session was extended",
    "Extension confirmed",
    `Your session has been extended by ${claimed.minutes} minutes. Head back to the room to continue.`,
  );
}
