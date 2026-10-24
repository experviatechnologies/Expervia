import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock,
  Wallet,
  TrendingUp,
  Settings,
  GraduationCap,
  CircleDot,
  CheckCircle2,
  Trophy,
  Info,
} from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ProspectsPanel, type Prospect } from "./prospects-panel";

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
  const matchRate =
    requestsSent > 0 ? Math.round((matches / requestsSent) * 100) : 0;

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
  const areaMax = Math.max(
    1,
    ...areaBreakdown.flatMap((a) => [a.validated, a.prospects]),
  );

  const prospectRows: Prospect[] = prospects.map((m) => ({
    id: m.id,
    name: nameById.get(m.id) ?? "A member",
    role: m.mentorship_intent,
    area: m.mentorship_capability_area_id
      ? (areaById.get(m.mentorship_capability_area_id) ?? "—")
      : "—",
    joined: formatDate(m.created_at),
  }));

  const navLinks = [
    {
      href: "/admin/mentorship/availability",
      label: "Availability",
      Icon: Clock,
    },
    { href: "/admin/mentorship/payouts", label: "Payouts", Icon: Wallet },
    { href: "/admin/mentorship/revenue", label: "Revenue", Icon: TrendingUp },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-7 md:px-8">
      {/* Heading + settings nav */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[640px]">
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Mentorship
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
            The standalone mentorship funnel. Mentor verifications are reviewed
            in{" "}
            <Link
              href="/admin/mentors"
              className="text-eten-accent font-semibold hover:underline"
            >
              Mentors
            </Link>
            .
          </p>
        </div>
        <nav aria-label="Mentorship settings" className="flex flex-wrap gap-2">
          {navLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors"
            >
              <Icon className="size-4" strokeWidth={1.8} />
              {label}
            </Link>
          ))}
          <Link
            href="/admin/mentorship/pilot"
            className="bg-eten-accent inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <Settings className="size-4" strokeWidth={1.8} />
            Pilot setup
          </Link>
        </nav>
      </header>

      {/* Funnel hero */}
      <section className="bg-eten-panel border-eten-line mb-6 flex flex-wrap items-stretch gap-6 rounded-[18px] border p-6">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-4">
          <div>
            <h2 className="text-eten-ink text-[17px] font-bold">
              Mentorship funnel
            </h2>
            <p className="text-eten-ink-muted mt-1 text-[13px]">
              From sign-up to validation
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            <FunnelRow
              label="Sign-ups"
              value={members.length}
              pct={100}
              fill="bg-eten-ink"
            />
            <FunnelRow
              label="Validated"
              value={validated.length}
              pct={
                members.length ? (validated.length / members.length) * 100 : 0
              }
              fill="bg-eten-accent"
            />
            <FunnelRow
              label="Prospects"
              value={prospects.length}
              pct={
                members.length ? (prospects.length / members.length) * 100 : 0
              }
              fill="bg-amber-500"
            />
          </div>
          <p className="text-eten-faint text-xs">
            Prospects are sign-ups still waiting to be validated.
          </p>
        </div>
        <div className="bg-eten-panel-hi flex flex-1 basis-[220px] flex-col items-center justify-center gap-2.5 rounded-2xl p-5">
          <Donut pct={conversion} />
          <span className="text-eten-ink-muted text-center text-[13px]">
            {validated.length} of {members.length} sign-ups validated
          </span>
        </div>
      </section>

      {/* Mentors & circles */}
      <div className="mb-6 flex flex-col gap-3">
        <h2 className="text-eten-faint font-mono text-[11px] font-bold tracking-[0.08em] uppercase">
          Mentors &amp; circles
        </h2>
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <StatCard
            Icon={GraduationCap}
            tone="accent"
            label="Verified mentors"
            value={mentorCount ?? 0}
          />
          <StatCard
            Icon={CircleDot}
            tone="accent"
            label="Active circles"
            value={activeCircles}
          />
          <StatCard
            Icon={CheckCircle2}
            tone="verified"
            label="Completed circles"
            value={completedCircles}
          />
          <StatCard
            Icon={Trophy}
            tone="neutral"
            label="Graduations"
            value={graduationCount ?? 0}
          />
        </div>
      </div>

      {/* Pilot activity */}
      <section className="bg-eten-panel border-eten-line mb-6 flex flex-col gap-4 rounded-[18px] border p-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-eten-ink text-[17px] font-bold">
              Pilot activity
            </h2>
            <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
              Pilot
            </span>
          </div>
          <span className="text-eten-ink-muted text-[13px]">
            {enrolments} mentee enrolment{enrolments === 1 ? "" : "s"} across
            Circles
          </span>
        </div>
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <PilotBox label="1:1 requests" value={requestsSent} />
          <PilotBox
            label="Matches"
            value={matches}
            badge={requestsSent > 0 ? `${matchRate}% matched` : undefined}
            badgeTone="green"
          />
          <PilotBox
            label="Pending requests"
            value={pendingRequests}
            badge={pendingRequests > 0 ? "Needs action" : undefined}
            badgeTone="amber"
          />
          <PilotBox label="Sessions held" value={sessionsHeld} />
        </div>
        <div className="bg-eten-panel-hi text-eten-ink-muted flex items-start gap-2.5 rounded-xl p-3.5 text-[13px]">
          <Info className="text-eten-accent mt-0.5 size-4 shrink-0" />
          Issue and feedback capture is not yet instrumented.
        </div>
      </section>

      {/* Capability + prospects */}
      <div className="flex flex-wrap items-start gap-4">
        <section className="bg-eten-panel border-eten-line flex min-w-0 flex-1 basis-[440px] flex-col gap-4 rounded-[18px] border p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-eten-ink text-[17px] font-bold">
                By capability area
              </h2>
              <p className="text-eten-ink-muted mt-1 text-[13px]">
                Prospects, validated members and circles
              </p>
            </div>
            <div className="text-eten-ink-muted flex gap-3.5 text-[12px] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="bg-eten-accent size-2.5 rounded-[3px]" />
                Validated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-amber-500" />
                Prospects
              </span>
            </div>
          </div>
          {areaBreakdown.length === 0 ? (
            <p className="text-eten-ink-muted py-6 text-center text-sm">
              No mentorship activity by area yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="text-left">
                    <AreaTh>Area</AreaTh>
                    <AreaTh className="w-[42%]">Validated · prospects</AreaTh>
                    <AreaTh className="text-right">Circles</AreaTh>
                  </tr>
                </thead>
                <tbody>
                  {areaBreakdown.map((a) => (
                    <tr
                      key={a.label}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="text-eten-ink py-3 pr-3 font-semibold">
                        {a.label}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <AreaBar
                            value={a.validated}
                            pct={(a.validated / areaMax) * 100}
                            fill="bg-eten-accent"
                            valueClass="text-eten-ink"
                          />
                          <AreaBar
                            value={a.prospects}
                            pct={(a.prospects / areaMax) * 100}
                            fill="bg-amber-500"
                            valueClass="text-amber-600 dark:text-amber-400"
                          />
                        </div>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <span
                          className={
                            "inline-block min-w-7 rounded-full px-2 py-0.5 text-center text-[13px] font-bold " +
                            (a.circles > 0
                              ? "bg-eten-accent-soft text-eten-accent"
                              : "bg-eten-panel-hi text-eten-faint")
                          }
                        >
                          {a.circles}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ProspectsPanel prospects={prospectRows} />
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  pct,
  fill,
}: {
  label: string;
  value: number;
  pct: number;
  fill: string;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)_44px] items-center gap-3 sm:grid-cols-[110px_minmax(0,1fr)_44px] sm:gap-3.5">
      <span className="text-eten-ink-muted text-[13px] font-semibold">
        {label}
      </span>
      <div className="bg-eten-accent-soft h-[34px] overflow-hidden rounded-[10px]">
        <span
          className={"block h-full rounded-[10px] " + fill}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <b className="text-eten-ink text-right text-[18px] font-extrabold tabular-nums">
        {value}
      </b>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const C = 2 * Math.PI * 50;
  const dash = (C * Math.max(0, Math.min(100, pct))) / 100;
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Conversion ${pct} percent`}
    >
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="var(--color-eten-accent-soft)"
        strokeWidth="12"
      />
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="var(--color-eten-accent)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fontSize="26"
        fontWeight="800"
        fill="var(--color-eten-ink)"
      >
        {pct}%
      </text>
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="var(--color-eten-faint)"
      >
        conversion
      </text>
    </svg>
  );
}

function StatCard({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "accent" | "verified" | "neutral";
  label: string;
  value: number;
}) {
  const square =
    tone === "verified"
      ? "bg-eten-verified-soft text-eten-verified"
      : tone === "neutral"
        ? "bg-eten-panel-hi text-eten-ink-muted"
        : "bg-eten-accent-soft text-eten-accent";
  return (
    <div className="bg-eten-panel border-eten-line flex items-center gap-4 rounded-2xl border p-5">
      <span
        className={
          "grid size-[46px] shrink-0 place-items-center rounded-[14px] " +
          square
        }
      >
        <Icon className="size-[22px]" strokeWidth={1.8} />
      </span>
      <div>
        <div className="text-eten-ink-muted text-[13px] font-semibold">
          {label}
        </div>
        <div className="text-eten-ink text-[28px] font-extrabold tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function PilotBox({
  label,
  value,
  badge,
  badgeTone,
}: {
  label: string;
  value: number;
  badge?: string;
  badgeTone?: "green" | "amber";
}) {
  return (
    <div className="border-eten-line rounded-[14px] border p-4">
      <div className="text-eten-ink-muted text-[13px] font-semibold">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-eten-ink text-[26px] font-extrabold tabular-nums">
          {value}
        </span>
        {badge && (
          <span
            className={
              "rounded-full px-2 py-0.5 text-[12px] font-bold " +
              (badgeTone === "amber"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-eten-verified-soft text-eten-verified")
            }
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function AreaBar({
  value,
  pct,
  fill,
  valueClass,
}: {
  value: number;
  pct: number;
  fill: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-eten-accent-soft h-[7px] flex-1 overflow-hidden rounded-full">
        <span
          className={"block h-full rounded-full " + fill}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <span
        className={
          "w-6 text-right text-[13px] font-bold tabular-nums " + valueClass
        }
      >
        {value}
      </span>
    </div>
  );
}

function AreaTh({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "text-eten-ink-muted border-eten-line border-b py-2 pr-3 text-[12px] font-bold " +
        className
      }
    >
      {children}
    </th>
  );
}
