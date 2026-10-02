import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMentorshipDefaults } from "@/lib/eten/availability";
import { AvailabilityEditor, type Prefs } from "./availability-editor";

export const metadata = { title: "Availability" };

export default async function MentorshipAvailabilityPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();

  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", member.id)
    .maybeSingle();
  const isVerifiedMentor = Boolean(mp && mp.mentor_status !== "candidate");

  if (!isVerifiedMentor) {
    return (
      <div className="mx-auto max-w-[820px] px-6 py-8">
        <h1 className="font-display text-2xl font-extrabold">Availability</h1>
        <p className="text-mnt-ink-muted mt-2 text-[14px] leading-relaxed">
          Only verified mentors can publish availability. Once the ETEN
          Readiness Panel verifies you, you&apos;ll set your weekly schedule
          here and mentees will be able to book conflict-free slots with you.
        </p>
      </div>
    );
  }

  const [{ data: prefsRow }, { data: blockRows }, { data: excRows }] =
    await Promise.all([
      admin
        .from("mentor_scheduling_prefs")
        .select(
          "timezone, default_session_minutes, min_notice_minutes, buffer_minutes, max_sessions_per_week, availability_status",
        )
        .eq("member_id", member.id)
        .maybeSingle(),
      admin
        .from("mentor_availability")
        .select("id, weekday, start_time, end_time")
        .eq("mentor_id", member.id)
        .order("weekday")
        .order("start_time"),
      admin
        .from("mentor_availability_exceptions")
        .select("id, exception_date, kind, start_time, end_time")
        .eq("mentor_id", member.id)
        .order("exception_date"),
    ]);

  let prefs: Prefs;
  if (prefsRow) {
    prefs = {
      timezone: prefsRow.timezone,
      defaultSessionMinutes: prefsRow.default_session_minutes,
      minNoticeMinutes: prefsRow.min_notice_minutes,
      bufferMinutes: prefsRow.buffer_minutes,
      maxSessionsPerWeek: prefsRow.max_sessions_per_week,
      availabilityStatus: prefsRow.availability_status,
    };
  } else {
    // First time here: seed the editor from the platform defaults (FR-20).
    const defaults = await getMentorshipDefaults();
    prefs = {
      timezone: "UTC",
      defaultSessionMinutes: defaults.defaultSessionMinutes,
      minNoticeMinutes: defaults.minNoticeMinutes,
      bufferMinutes: defaults.bufferMinutes,
      maxSessionsPerWeek: null,
      availabilityStatus: "accepting",
    };
  }

  return (
    <div className="mx-auto max-w-[820px] px-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold">Availability</h1>
        <p className="text-mnt-ink-muted mt-1 text-[14px] leading-relaxed">
          Publish when you&apos;re free. Mentees see conflict-free slots
          generated from this, converted to their own timezone, never your raw
          calendar.
        </p>
      </header>

      <AvailabilityEditor
        prefs={prefs}
        hasPrefs={Boolean(prefsRow)}
        blocks={(blockRows ?? []).map((b) => ({
          id: b.id,
          weekday: b.weekday,
          startTime: String(b.start_time).slice(0, 5),
          endTime: String(b.end_time).slice(0, 5),
        }))}
        exceptions={(excRows ?? []).map((e) => ({
          id: e.id,
          date: e.exception_date,
          kind: e.kind,
          startTime: e.start_time ? String(e.start_time).slice(0, 5) : null,
          endTime: e.end_time ? String(e.end_time).slice(0, 5) : null,
        }))}
      />
    </div>
  );
}
