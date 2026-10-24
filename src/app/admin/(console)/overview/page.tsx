import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  Activity,
  Clock,
  Boxes,
  BadgeCheck,
  ArrowRight,
  UserPlus,
  CalendarDays,
} from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { timeAgo } from "@/lib/time";
import { auditLabel, auditTone } from "@/lib/eten/audit-labels";
import { getOverviewMetrics } from "./metrics";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const { counts, pods, verification, kyc, growth, recentActivity } =
    await getOverviewMetrics();

  const addedThisMonth = growth.length ? growth[growth.length - 1].added : 0;
  const activePct = counts.totalMembers
    ? Math.round((counts.activeMembers / counts.totalMembers) * 100)
    : 0;
  const recentPct = counts.totalMembers
    ? Math.round((counts.activeLast30 / counts.totalMembers) * 100)
    : 0;
  const maxPod = Math.max(1, ...pods.map((p) => p.members));
  const funnelBase = Math.max(1, verification.submitted);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-7 md:px-8">
      {/* Page heading */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eten-accent mb-1.5 text-[13px] font-semibold">
            Dashboard
          </p>
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Overview
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px]">
            Community health at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="border-eten-line text-eten-ink-muted inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold">
            <CalendarDays className="size-4" strokeWidth={1.8} />
            Last 8 months
          </span>
          <Link
            href="/admin/migration"
            className="bg-eten-accent inline-flex h-11 items-center gap-2 rounded-xl px-[18px] text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <UserPlus className="size-4" strokeWidth={2} />
            Invite members
          </Link>
        </div>
      </header>

      {/* Attention row (only when something needs action) */}
      {(counts.certsToReview > 0 || counts.openReports > 0) && (
        <div className="mb-5 flex flex-wrap gap-3">
          {counts.certsToReview > 0 && (
            <Link
              href="/admin/certifications"
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400"
            >
              {counts.certsToReview} certification
              {counts.certsToReview === 1 ? "" : "s"} awaiting review
              <ArrowRight className="size-4" />
            </Link>
          )}
          {counts.openReports > 0 && (
            <Link
              href="/admin/reports"
              className="text-destructive border-destructive/30 bg-destructive/10 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
            >
              {counts.openReports} open report
              {counts.openReports === 1 ? "" : "s"}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-4 grid [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <Kpi Icon={Users} label="Total members" value={counts.totalMembers}>
          {addedThisMonth > 0 ? (
            <>
              <Chip>+{addedThisMonth}</Chip> new this month
            </>
          ) : (
            "No new joins this month"
          )}
        </Kpi>
        <Kpi Icon={Activity} label="Active (30d)" value={counts.activeLast30}>
          <Bar pct={recentPct} />
          {recentPct}% signed in recently
        </Kpi>
        <Kpi Icon={UserCheck} label="Signed in" value={counts.activeMembers}>
          <Bar pct={activePct} />
          {activePct}% ever
        </Kpi>
        <Kpi
          Icon={Clock}
          label="Pending activation"
          value={counts.pendingActivation}
        >
          Awaiting first sign-in
        </Kpi>
        <Kpi Icon={Boxes} label="Pods" value={counts.podCount}>
          <b className="text-eten-ink font-bold">{counts.multiPodMembers}</b>{" "}
          members in 2+ pods
        </Kpi>
        <Kpi
          Icon={BadgeCheck}
          label="Certs to review"
          value={counts.certsToReview}
          tone={counts.certsToReview > 0 ? "accent" : "verified"}
        >
          {counts.certsToReview > 0 ? (
            "Needs review"
          ) : (
            <span className="text-eten-verified inline-flex items-center gap-1.5 font-semibold">
              <span className="bg-eten-verified size-2 rounded-full" /> All
              clear
            </span>
          )}
        </Kpi>
      </div>

      {/* Growth + funnel */}
      <div className="mb-4 flex flex-wrap gap-4">
        <Card
          className="flex-[2_1_520px]"
          title="Member growth"
          sub="New self-serve sign-ups (bars) vs total members (line) · last 8 months"
        >
          <GrowthChart data={growth} />
          <p className="text-eten-faint mt-2 text-xs">
            Bulk-migrated legacy members are excluded from the bars.
          </p>
        </Card>

        <Card
          className="flex-[1_1_320px]"
          title="Verification funnel"
          sub="Certification reviews"
          href="/admin/certifications"
          hrefLabel="Review queue"
        >
          <div className="flex flex-col gap-3.5">
            <FunnelBar
              label="Submitted"
              value={verification.submitted}
              pct={100}
              fill="bg-eten-accent"
            />
            <FunnelBar
              label="In review"
              value={verification.pending}
              pct={(verification.pending / funnelBase) * 100}
              fill="bg-amber-500"
            />
            <FunnelBar
              label="Verified"
              value={verification.verified}
              pct={(verification.verified / funnelBase) * 100}
              fill="bg-eten-verified"
            />
            <p className="text-eten-faint text-xs">
              {verification.rejected} rejected
            </p>
          </div>

          <div className="border-eten-line-soft mt-4 border-t pt-4">
            <p className="text-eten-faint mb-2 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
              Identity &amp; address (KYC)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <KycStat value={kyc.identityVerified} label="ID verified" />
              <KycStat value={kyc.addressVerified} label="Address verified" />
              <KycStat value={kyc.pending} label="Pending" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pods + activity */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <Card
          title="Members by pod"
          sub="Total members in each specialist pod"
          href="/admin/pods"
          hrefLabel="All pods"
        >
          {pods.length === 0 ? (
            <Empty>No pods yet.</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {pods.map((p) => (
                <div
                  key={p.name}
                  className="grid grid-cols-[minmax(0,160px)_minmax(0,1fr)_36px] items-center gap-3.5"
                >
                  <span className="text-eten-ink-muted truncate text-[13px] font-medium">
                    {p.name}
                  </span>
                  <span className="bg-eten-accent-soft h-2 overflow-hidden rounded-full">
                    <span
                      className="bg-eten-accent block h-full rounded-full"
                      style={{ width: `${(p.members / maxPod) * 100}%` }}
                    />
                  </span>
                  <span className="text-eten-ink text-right text-[13px] font-bold tabular-nums">
                    {p.members}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent activity"
          sub="Latest moderation and admin actions"
          href="/admin/audit"
          hrefLabel="Audit log"
        >
          {recentActivity.length === 0 ? (
            <Empty>No recorded activity yet.</Empty>
          ) : (
            <div className="flex flex-col">
              {recentActivity.map((a) => {
                const tone = auditTone(a.action);
                return (
                  <div
                    key={a.id}
                    className="border-eten-line-soft flex items-center gap-3.5 border-b py-3.5 last:border-b-0"
                  >
                    <span
                      className={
                        "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold " +
                        TONE[tone]
                      }
                    >
                      {tone === "good"
                        ? "✓"
                        : tone === "danger"
                          ? "!"
                          : tone === "warn"
                            ? "⚑"
                            : "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-eten-ink-muted text-[14px]">
                        <b className="text-eten-ink font-bold">
                          {a.actorName ?? "Someone"}
                        </b>{" "}
                        {auditLabel(a.action)}
                      </p>
                      <p className="text-eten-faint mt-0.5 text-[12px]">
                        {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  good: "bg-eten-verified-soft text-eten-verified",
  danger: "bg-destructive/10 text-destructive",
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "bg-eten-accent-soft text-eten-accent",
};

/** A KPI tile: label + tinted icon square, a big number, and a footer slot. */
function Kpi({
  Icon,
  label,
  value,
  tone = "accent",
  children,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value?: number;
  tone?: "accent" | "verified";
  children: React.ReactNode;
}) {
  const square =
    tone === "verified"
      ? "bg-eten-verified-soft text-eten-verified"
      : "bg-eten-accent-soft text-eten-accent";
  return (
    <div className="bg-eten-panel border-eten-line flex flex-col gap-3.5 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-eten-ink-muted text-[13px] font-semibold">
          {label}
        </span>
        <span
          className={"grid size-9 place-items-center rounded-[10px] " + square}
        >
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </span>
      </div>
      {typeof value === "number" && (
        <div className="text-eten-ink text-[32px] font-extrabold tracking-[-0.02em] tabular-nums">
          {value}
        </div>
      )}
      <div className="text-eten-ink-muted flex items-center gap-2 text-[13px]">
        {children}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-eten-verified-soft text-eten-verified rounded-full px-2 py-0.5 text-[12px] font-bold">
      {children}
    </span>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <span className="bg-eten-accent-soft h-1.5 flex-1 overflow-hidden rounded-full">
      <span
        className="bg-eten-accent block h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </span>
  );
}

function KycStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-eten-panel-hi rounded-xl p-3">
      <div className="text-eten-ink text-[20px] font-extrabold">{value}</div>
      <div className="text-eten-ink-muted text-[12px]">{label}</div>
    </div>
  );
}

function Card({
  title,
  sub,
  href,
  hrefLabel,
  className,
  children,
}: {
  title: string;
  sub?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        "bg-eten-panel border-eten-line min-w-0 rounded-2xl border p-6 " +
        (className ?? "")
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-eten-ink text-[17px] font-bold">{title}</h2>
          {sub && <p className="text-eten-faint mt-1 text-[13px]">{sub}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="text-eten-accent inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold"
          >
            {hrefLabel} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function FunnelBar({
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
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[13px]">
        <span className="text-eten-ink-muted font-medium">{label}</span>
        <b className="text-eten-ink font-bold">{value}</b>
      </div>
      <div className="bg-eten-accent-soft h-2.5 overflow-hidden rounded-full">
        <span
          className={"block h-full rounded-full " + fill}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-eten-faint py-4 text-sm">{children}</p>;
}

/**
 * Member-growth chart. Cumulative area+line (total members) with faint
 * per-month "new sign-up" bars, sharing one y-scale. Colors come from the
 * eten-* CSS variables so the chart follows the light/dark toggle.
 */
function GrowthChart({
  data,
}: {
  data: { label: string; added: number; cumulative: number }[];
}) {
  if (data.length === 0) return <Empty>No data yet.</Empty>;

  const W = 720;
  const H = 240;
  const padL = 44;
  const padR = 14;
  const padT = 16;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;

  const maxCum = Math.max(1, ...data.map((d) => d.cumulative));
  const niceMax =
    maxCum >= 50 ? Math.ceil(maxCum / 50) * 50 : Math.ceil(maxCum / 10) * 10;

  const x = (i: number) =>
    padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH * (1 - v / niceMax);
  const baseY = y(0);

  const pts = data.map((d, i) => `${x(i)},${y(d.cumulative)}`);
  const linePath = "M" + pts.join(" L");
  const areaPath = `M${x(0)},${baseY} L${pts.join(" L")} L${x(n - 1)},${baseY} Z`;
  const barW = Math.min(26, (innerW / n) * 0.42);
  const ticks = [
    niceMax,
    Math.round((niceMax * 2) / 3),
    Math.round(niceMax / 3),
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[440px]"
        role="img"
        aria-label="Member growth over the last 8 months"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={y(t)}
              x2={W - padR}
              y2={y(t)}
              stroke="var(--color-eten-line)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padL - 8}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-eten-faint)"
            >
              {t}
            </text>
          </g>
        ))}
        <line
          x1={padL}
          y1={baseY}
          x2={W - padR}
          y2={baseY}
          stroke="var(--color-eten-line)"
          strokeWidth="1"
        />

        {data.map((d, i) => {
          const h = (d.added / niceMax) * innerH;
          return (
            <rect
              key={`bar-${i}`}
              x={x(i) - barW / 2}
              y={baseY - h}
              width={barW}
              height={Math.max(0, h)}
              rx="6"
              fill="var(--color-eten-accent)"
              fillOpacity="0.28"
            />
          );
        })}

        <path d={areaPath} fill="var(--color-eten-accent)" fillOpacity="0.08" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-eten-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={x(n - 1)}
          cy={y(data[n - 1].cumulative)}
          r="5"
          fill="var(--color-eten-accent)"
          stroke="var(--color-eten-panel)"
          strokeWidth="3"
        />

        {data.map((d, i) => (
          <text
            key={`lab-${i}`}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="12"
            fill="var(--color-eten-faint)"
          >
            {d.label}
          </text>
        ))}
      </svg>

      <div className="text-eten-faint mt-2 flex flex-wrap items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-eten-accent inline-block h-[3px] w-3.5 rounded-sm" />
          Cumulative
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-eten-accent/30 inline-block h-2.5 w-2.5 rounded-sm" />
          New sign-ups
        </span>
      </div>
    </div>
  );
}
