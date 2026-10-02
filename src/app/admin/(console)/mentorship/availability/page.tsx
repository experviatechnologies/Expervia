import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Mentor availability",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  accepting: "Accepting",
  limited: "Limited",
  unavailable: "Unavailable",
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Mentor availability
          </h1>
          <p className="text-eten-ink-muted mt-1 text-sm">
            Platform scheduling defaults and a live view of mentor capacity.
          </p>
        </div>
        <Link
          href="/admin/mentorship"
          className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          ← Mentorship
        </Link>
      </header>

      <section className="border-eten-line bg-eten-panel mb-8 rounded-2xl border p-5">
        <h2 className="text-eten-ink text-sm font-bold">Scheduling defaults</h2>
        <p className="text-eten-ink-muted mt-1 mb-4 text-xs">
          Used to seed a mentor&apos;s availability editor the first time they
          open it. Changing these does not alter mentors who already set their
          own.
        </p>
        <SettingsForm initial={defaults} />
      </section>

      <section className="border-eten-line bg-eten-panel rounded-2xl border p-5">
        <h2 className="text-eten-ink text-sm font-bold">
          Mentor capacity · {prefs.length}
        </h2>
        {prefs.length === 0 ? (
          <p className="text-eten-ink-muted mt-2 text-sm">
            No mentors have set their availability yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-eten-ink-muted border-eten-line border-b text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Mentor</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Timezone</th>
                  <th className="py-2 pr-4 font-medium">Weekly blocks</th>
                  <th className="py-2 pr-4 font-medium">Session len</th>
                  <th className="py-2 pr-4 font-medium">Max/wk</th>
                  <th className="py-2 pr-4 font-medium">Upcoming</th>
                </tr>
              </thead>
              <tbody>
                {prefs.map((p) => (
                  <tr
                    key={p.member_id}
                    className="border-eten-line/60 border-b"
                  >
                    <td className="py-2 pr-4 font-semibold">
                      {nameById.get(p.member_id) ?? "A mentor"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          p.availability_status === "accepting"
                            ? "text-eten-verified"
                            : p.availability_status === "limited"
                              ? "text-amber-400"
                              : "text-eten-ink-muted"
                        }
                      >
                        {STATUS_LABEL[p.availability_status] ??
                          p.availability_status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{p.timezone}</td>
                    <td className="py-2 pr-4">
                      {blockCount.get(p.member_id) ?? 0}
                    </td>
                    <td className="py-2 pr-4">{p.default_session_minutes}m</td>
                    <td className="py-2 pr-4">
                      {p.max_sessions_per_week ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {upcomingCount.get(p.member_id) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
