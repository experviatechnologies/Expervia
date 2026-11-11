import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPush } from "@/lib/pwa/push";

type Admin = ReturnType<typeof getSupabaseAdmin>;

/** Remind people about sessions starting within this many minutes. */
const WINDOW_MIN = 20;

/**
 * "Your session starts soon" push for mentorship sessions and live classes
 * (PWA phase 4). Run every 15 minutes by the scheduled job
 * (/api/tracker/cron), so each session falls in one run's window and is
 * reminded 5 to 20 minutes before it starts. Each session is claimed by
 * setting circle_sessions.reminder_sent_at first, so it is never reminded
 * twice. Goes to the Circle's mentor and the session's mentees, on devices
 * where they turned notifications on and kept session reminders.
 */
export async function sendSessionReminders(
  admin: Admin = getSupabaseAdmin(),
): Promise<Record<string, number>> {
  const now = Date.now();
  const { data: claimed, error } = await admin
    .from("circle_sessions")
    .update({ reminder_sent_at: new Date(now).toISOString() })
    .is("reminder_sent_at", null)
    .gt("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + WINDOW_MIN * 60_000).toISOString())
    .select("id, circle_id, title, starts_at");
  if (error) {
    // Migration 62 not run yet: nothing to do, not a failure.
    if (error.code === "42703" || error.code === "PGRST204") {
      return { skipped: 1 };
    }
    throw new Error(error.message);
  }
  if (!claimed?.length) return { sessions: 0, devices: 0 };

  const circleIds = [...new Set(claimed.map((s) => s.circle_id as string))];
  const [{ data: circles }, { data: attendance }] = await Promise.all([
    admin
      .from("mentorship_circles")
      .select("id, mentor_id")
      .in("id", circleIds),
    admin
      .from("session_attendance")
      .select("session_id, member_id")
      .in(
        "session_id",
        claimed.map((s) => s.id as string),
      ),
  ]);
  const mentorOf = new Map(
    (circles ?? []).map((c) => [c.id as string, c.mentor_id as string]),
  );

  let devices = 0;
  for (const s of claimed) {
    const minutes = Math.max(
      1,
      Math.round((Date.parse(s.starts_at as string) - now) / 60_000),
    );
    const people = [
      mentorOf.get(s.circle_id as string),
      ...(attendance ?? [])
        .filter((a) => a.session_id === s.id)
        .map((a) => a.member_id as string),
    ];
    const name = (s.title as string | null)?.trim() || "Your session";
    devices += await sendPush(people, "session_reminder", {
      title: `Starts in ${minutes} minutes`,
      body: `${name} starts soon. The room opens 10 minutes before. Tap to join.`,
      url: `/mentorship/circles/${s.circle_id}/class/${s.id}`,
      tag: `session-reminder:${s.id}`,
    });
  }
  return { sessions: claimed.length, devices };
}
