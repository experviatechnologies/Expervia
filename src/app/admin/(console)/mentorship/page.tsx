import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Mentorship",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type MemberRow = {
  id: string;
  mentorship_intent: "mentee" | "mentor" | null;
  mentorship_capability_area_id: string | null;
  validated_at: string | null;
  created_at: string;
};
type CircleRow = {
  id: string;
  title: string | null;
  status: string;
  mentor_id: string;
  capability_area_id: string | null;
};

export default async function AdminMentorshipPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const [{ data: memberData }, { data: circleData }] = await Promise.all([
    admin
      .from("members")
      .select(
        "id, mentorship_intent, mentorship_capability_area_id, validated_at, created_at",
      )
      .eq("signup_source", "mentorship")
      .order("created_at", { ascending: false }),
    admin
      .from("mentorship_circles")
      .select("id, title, status, mentor_id, capability_area_id")
      .not("capability_area_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const members = (memberData ?? []) as MemberRow[];
  const circles = (circleData ?? []) as CircleRow[];

  const prospects = members.filter((m) => !m.validated_at);
  const validated = members.filter((m) => m.validated_at);
  const conversion =
    members.length > 0
      ? Math.round((validated.length / members.length) * 100)
      : 0;

  // Resolve names, areas, and per-circle mentee counts.
  const memberIds = [
    ...new Set([
      ...members.map((m) => m.id),
      ...circles.map((c) => c.mentor_id),
    ]),
  ];
  const areaIds = [
    ...new Set([
      ...members.map((m) => m.mentorship_capability_area_id),
      ...circles.map((c) => c.capability_area_id),
    ]),
  ].filter((x): x is string => Boolean(x));
  const circleIds = circles.map((c) => c.id);

  const [
    { data: profileRows },
    { data: areaRows },
    { data: cmRows },
    { count: mentorCount },
    { count: graduationCount },
    { data: requestRows },
    { count: sessionCount },
  ] = await Promise.all([
    memberIds.length
      ? admin
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", memberIds)
      : Promise.resolve({ data: [] }),
    areaIds.length
      ? admin.from("capability_areas").select("id, label").in("id", areaIds)
      : Promise.resolve({ data: [] }),
    circleIds.length
      ? admin
          .from("circle_memberships")
          .select("circle_id")
          .in("circle_id", circleIds)
      : Promise.resolve({ data: [] }),
    admin
      .from("mentor_profiles")
      .select("member_id", { count: "exact", head: true }),
    admin
      .from("recognition_events")
      .select("id", { count: "exact", head: true })
      .eq("badge_key", "circle_graduate"),
    admin.from("mentorship_requests").select("status"),
    circleIds.length
      ? admin
          .from("circle_sessions")
          .select("id", { count: "exact", head: true })
          .in("circle_id", circleIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );
  const areaById = new Map((areaRows ?? []).map((a) => [a.id, a.label]));
  const menteeCount = new Map<string, number>();
  for (const r of cmRows ?? [])
    menteeCount.set(r.circle_id, (menteeCount.get(r.circle_id) ?? 0) + 1);

  const activeCircles = circles.filter((c) => c.status === "active").length;
  const completedCircles = circles.filter(
    (c) => c.status === "completed",
  ).length;

  // Pilot activity: 1:1 requests, matches, sessions and Circle enrolments.
  const requests = (requestRows ?? []) as { status: string }[];
  const requestsSent = requests.length;
  const matches = requests.filter((r) => r.status === "accepted").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const sessionsHeld = sessionCount ?? 0;
  const enrolments = (cmRows ?? []).length;

  // Per capability area: prospects, validated and Circles.
  type AreaStat = {
    label: string;
    prospects: number;
    validated: number;
    circles: number;
  };
  const areaStats = new Map<string, AreaStat>();
  const ensureArea = (areaId: string): AreaStat => {
    let s = areaStats.get(areaId);
    if (!s) {
      s = {
        label: areaById.get(areaId) ?? "Unknown area",
        prospects: 0,
        validated: 0,
        circles: 0,
      };
      areaStats.set(areaId, s);
    }
    return s;
  };
  for (const m of members) {
    if (!m.mentorship_capability_area_id) continue;
    const s = ensureArea(m.mentorship_capability_area_id);
    if (m.validated_at) s.validated += 1;
    else s.prospects += 1;
  }
  for (const c of circles) {
    if (c.capability_area_id) ensureArea(c.capability_area_id).circles += 1;
  }
  const areaBreakdown = [...areaStats.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
            Mentorship
          </h1>
          <p className="text-eten-ink-muted mt-1 text-sm">
            The standalone mentorship funnel. Mentor verifications are reviewed
            in{" "}
            <Link
              href="/admin/mentors"
              className="text-eten-accent hover:underline"
            >
              Mentors
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/admin/mentorship/availability"
            className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            Availability
          </Link>
          <Link
            href="/admin/mentorship/payouts"
            className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            Payouts
          </Link>
          <Link
            href="/admin/mentorship/pilot"
            className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            Pilot setup
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Mentorship signups" value={members.length} />
        <Kpi label="Prospects" value={prospects.length} tone="text-amber-400" />
        <Kpi
          label="Validated"
          value={validated.length}
          tone="text-eten-verified"
        />
        <Kpi label="Conversion" value={`${conversion}%`} />
      </div>

      {/* Programme metrics */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Verified mentors" value={mentorCount ?? 0} />
        <Kpi label="Active Circles" value={activeCircles} />
        <Kpi label="Completed Circles" value={completedCircles} />
        <Kpi
          label="Graduations"
          value={graduationCount ?? 0}
          tone="text-eten-verified"
        />
      </div>

      {/* Pilot activity */}
      <section className="mb-8">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Pilot activity
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="1:1 requests" value={requestsSent} />
          <Kpi label="Matches" value={matches} tone="text-eten-verified" />
          <Kpi label="Pending requests" value={pendingRequests} />
          <Kpi label="Sessions held" value={sessionsHeld} />
        </div>
        <p className="text-eten-faint mt-2 text-xs">
          {enrolments} mentee enrolment{enrolments === 1 ? "" : "s"} across
          Circles. Issue and feedback capture is not yet instrumented.
        </p>
      </section>

      {/* Capability-area breakdown */}
      <section className="mb-8">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          By capability area
        </h2>
        {areaBreakdown.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint rounded-2xl border p-8 text-center text-sm">
            No mentorship activity by area yet.
          </div>
        ) : (
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Capability area</Th>
                    <Th>Prospects</Th>
                    <Th>Validated</Th>
                    <Th>Circles</Th>
                  </tr>
                </thead>
                <tbody>
                  {areaBreakdown.map((a) => (
                    <tr
                      key={a.label}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="text-eten-ink px-4 py-3 font-medium">
                        {a.label}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 tabular-nums">
                        {a.prospects}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 tabular-nums">
                        {a.validated}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 tabular-nums">
                        {a.circles}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Prospects */}
      <section className="mb-8">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Prospects · {prospects.length}
        </h2>
        {prospects.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
            <Sparkles className="text-eten-faint/50 size-9" />
            <p className="text-sm">No unvalidated prospects right now.</p>
          </div>
        ) : (
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Name</Th>
                    <Th>Registered as</Th>
                    <Th>Capability area</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.slice(0, 50).map((m) => (
                    <tr
                      key={m.id}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="text-eten-ink font-medium hover:underline"
                        >
                          {nameById.get(m.id) ?? "A member"}
                        </Link>
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 capitalize">
                        {m.mentorship_intent ?? "—"}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {m.mentorship_capability_area_id
                          ? (areaById.get(m.mentorship_capability_area_id) ??
                            "—")
                          : "—"}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                        {formatDate(m.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Circles */}
      <section>
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Circles · {circles.length}
        </h2>
        {circles.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint rounded-2xl border p-8 text-center text-sm">
            No mentorship Circles yet.
          </div>
        ) : (
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Circle</Th>
                    <Th>Mentor</Th>
                    <Th>Area</Th>
                    <Th>Mentees</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {circles.map((c) => (
                    <tr
                      key={c.id}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="text-eten-ink px-4 py-3 font-medium">
                        {c.title ?? "Circle"}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {nameById.get(c.mentor_id) ?? "A mentor"}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {c.capability_area_id
                          ? (areaById.get(c.capability_area_id) ?? "—")
                          : "—"}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 tabular-nums">
                        {menteeCount.get(c.id) ?? 0}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 capitalize">
                        {c.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
      <div className="text-eten-faint font-mono text-[11px] tracking-wider uppercase">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-extrabold ${tone ?? "text-eten-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-eten-faint px-4 py-3 font-mono text-[11px] font-bold tracking-wider uppercase">
      {children}
    </th>
  );
}
