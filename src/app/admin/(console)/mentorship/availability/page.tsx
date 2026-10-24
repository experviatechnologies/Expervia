import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SettingsForm } from "./settings-form";
import { CapacityTable, type MentorCapacity } from "./capacity-table";

export const metadata: Metadata = {
  title: "Mentor availability",
  robots: { index: false, follow: false },
};

export default async function AdminAvailabilityPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const [{ data: settings }, { data: prefsRows }, { data: blockRows }] =
    await Promise.all([
      admin
        .from("mentorship_settings")
        .select("default_session_minutes, min_notice_minutes, buffer_minutes")
        .eq("id", true)
        .maybeSingle(),
      admin
        .from("mentor_scheduling_prefs")
        .select(
          "member_id, timezone, availability_status, default_session_minutes, max_sessions_per_week",
        ),
      admin.from("mentor_availability").select("mentor_id"),
    ]);

  const prefs = prefsRows ?? [];

  // Weekly block counts (a rough capacity signal).
  const blockCount = new Map<string, number>();
  for (const b of blockRows ?? [])
    blockCount.set(b.mentor_id, (blockCount.get(b.mentor_id) ?? 0) + 1);

  // Names + upcoming session counts per mentor.
  const memberIds = prefs.map((p) => p.member_id);
  const [{ data: profileRows }, { data: upcomingRows }] = await Promise.all([
    memberIds.length
      ? admin
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", memberIds)
      : Promise.resolve({ data: [] }),
    admin
      .from("circle_sessions")
      .select("starts_at, mentorship_circles!inner(mentor_id)")
      .not("starts_at", "is", null)
      .gte("starts_at", nowIso),
  ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );
  const upcomingCount = new Map<string, number>();
  for (const r of upcomingRows ?? []) {
    const mc = (
      r as {
        mentorship_circles?: { mentor_id?: string } | { mentor_id?: string }[];
      }
    ).mentorship_circles;
    const mentorId = Array.isArray(mc) ? mc[0]?.mentor_id : mc?.mentor_id;
    if (mentorId)
      upcomingCount.set(mentorId, (upcomingCount.get(mentorId) ?? 0) + 1);
  }

  const defaults = {
    defaultSessionMinutes: settings?.default_session_minutes ?? 40,
    minNoticeMinutes: settings?.min_notice_minutes ?? 120,
    bufferMinutes: settings?.buffer_minutes ?? 10,
  };

  const mentors: MentorCapacity[] = prefs.map((p) => ({
    id: p.member_id,
    name: nameById.get(p.member_id) ?? "A mentor",
    status: p.availability_status,
    timezone: p.timezone,
    blocks: blockCount.get(p.member_id) ?? 0,
    sessionLen: p.default_session_minutes,
    maxPerWeek: p.max_sessions_per_week ?? null,
    upcoming: upcomingCount.get(p.member_id) ?? 0,
  }));

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-7 md:px-8">
      {/* Heading + back */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[640px]">
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Mentor availability
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
            Platform scheduling defaults and a live view of mentor capacity.
          </p>
        </div>
        <Link
          href="/admin/mentorship"
          className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to Mentorship
        </Link>
      </header>

      {/* Scheduling defaults */}
      <section className="bg-eten-panel border-eten-line mb-6 rounded-[18px] border p-6">
        <SettingsForm initial={defaults} />
      </section>

      {/* Mentor capacity */}
      <CapacityTable mentors={mentors} />
    </div>
  );
}
