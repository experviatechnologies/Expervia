import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  Clock,
  Boxes,
  BadgeCheck,
  ArrowRight,
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

  const { counts, pods, verification, growth, recentActivity } =
    await getOverviewMetrics();

  const addedThisMonth = growth.length ? growth[growth.length - 1].added : 0;
  const activePct = counts.totalMembers
    ? Math.round((counts.activeMembers / counts.totalMembers) * 100)
    : 0;
  const maxPod = Math.max(1, ...pods.map((p) => p.members));
  const funnelBase = Math.max(1, verification.submitted);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Overview
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Community health at a glance.
        </p>
      </header>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
        <Kpi
          Icon={Users}
          label="Total members"
          value={counts.totalMembers}
          hint={
            addedThisMonth > 0
              ? `+${addedThisMonth} this month`
              : "No new joins"
          }
          tone={addedThisMonth > 0 ? "up" : "flat"}
        />
        <Kpi
          Icon={UserCheck}
          label="Active"
          value={counts.activeMembers}
          hint={`${activePct}% of members`}
          tone="flat"
        />
        <Kpi
          Icon={Clock}
          label="Pending activation"
          value={counts.pendingActivation}
          hint="Awaiting first sign-in"
          tone="flat"
        />
        <Kpi
          Icon={Boxes}
          label="Pods"
          value={counts.podCount}
          hint={`${counts.multiPodMembers} in ≥2 pods`}
          tone="flat"
        />
        <Kpi
          Icon={BadgeCheck}
          label="Certs to review"
          value={counts.certsToReview}
          hint={counts.certsToReview > 0 ? "Needs review" : "All clear"}
          tone={counts.certsToReview > 0 ? "attn" : "flat"}
        />
      </div>

      {/* Attention row */}
      {(counts.certsToReview > 0 || counts.openReports > 0) && (
        <div className="mb-4 flex flex-wrap gap-3">
          {counts.certsToReview > 0 && (
            <Link
              href="/admin/certifications"
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400"
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

      {/* Member growth */}
      <div className="mb-4">
        <Card
          title="Member growth"
          sub="New & cumulative members · last 8 months"
        >
          <GrowthChart data={growth} />
        </Card>
      </div>

      {/* Pods + verification funnel */}
      <div className="mb-4 grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Members by pod"
          sub="Total members in each specialist pod"
          href="/admin/pods"
          hrefLabel="Pods"
        >
          {pods.length === 0 ? (
            <Empty>No pods yet.</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {pods.map((p) => (
                <div
                  key={p.name}
                  className="grid grid-cols-[110px_1fr_36px] items-center gap-3"
                >
                  <span className="text-eten-ink-muted truncate text-[12.5px] font-semibold">
                    {p.name}
                  </span>
                  <span className="bg-eten-panel-hi h-2.5 overflow-hidden rounded-full">
                    <span
                      className="from-eten-accent block h-full rounded-full bg-gradient-to-r to-[#6e9df0]"
                      style={{ width: `${(p.members / maxPod) * 100}%` }}
                    />
                  </span>
                  <span className="text-eten-ink text-right text-[12.5px] font-bold tabular-nums">
                    {p.members}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Verification funnel"
          sub="Certifications (identity & address arrive in Phase 6)"
        >
          <div className="flex flex-col gap-2.5">
            <FunnelBar
              label="Submitted"
              value={verification.submitted}
              width={100}
              from="#4f86ec"
              to="#6e9df0"
            />
            <FunnelBar
              label="In review"
              value={verification.pending}
              width={(verification.pending / funnelBase) * 100}
              from="#c99a2f"
              to="#f5b544"
            />
            <FunnelBar
              label="Verified"
              value={verification.verified}
              width={(verification.verified / funnelBase) * 100}
              from="#2f9e6b"
              to="#3ec98a"
            />
          </div>
          <p className="text-eten-faint mt-3 text-xs">
            {verification.rejected} rejected
          </p>
        </Card>
      </div>

      {/* Recent activity */}
      <Card
        title="Recent activity"
        sub="Latest moderation & admin actions"
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
                  className="border-eten-line-soft flex items-center gap-3 border-t py-2.5 first:border-t-0"
                >
                  <span
                    className={
                      "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold " +
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
                    <p className="text-eten-ink text-[13px]">
                      <b className="font-semibold">
                        {a.actorName ?? "Someone"}
                      </b>{" "}
                      — {auditLabel(a.action)}
                    </p>
                    <p className="text-eten-faint text-[11.5px]">
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
  );
}

const TONE: Record<string, string> = {
  good: "bg-eten-verified-soft text-eten-verified",
  danger: "bg-destructive/10 text-destructive",
  warn: "bg-amber-500/10 text-amber-400",
  info: "bg-eten-accent-soft text-eten-accent",
};

function Kpi({
  Icon,
  label,
  value,
  hint,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
  tone: "up" | "flat" | "attn";
}) {
  const toneClass =
    tone === "up"
      ? "text-eten-verified"
      : tone === "attn"
        ? "text-amber-400"
        : "text-eten-faint";
  return (
    <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
      <div className="text-eten-faint flex items-center gap-2 text-xs font-semibold">
        <Icon className="size-[15px]" />
        {label}
      </div>
      <div className="text-eten-ink mt-2 text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">
        {value}
      </div>
      <div className={"mt-1 text-xs font-semibold " + toneClass}>{hint}</div>
    </div>
  );
}

function Card({
  title,
  sub,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  sub?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-eten-panel border-eten-line rounded-2xl border p-[18px]">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-eten-ink text-[14.5px] font-bold">{title}</h2>
          {sub && <p className="text-eten-faint mt-0.5 text-xs">{sub}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="text-eten-accent inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold"
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
  width,
  from,
  to,
}: {
  label: string;
  value: number;
  width: number;
  from: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 min-w-[56px] items-center rounded-lg px-3 text-[13px] font-bold text-white tabular-nums"
        style={{
          width: `${Math.max(8, Math.min(100, width))}%`,
          background: `linear-gradient(90deg, ${from}, ${to})`,
        }}
      >
        {value}
      </span>
      <span className="text-eten-faint text-xs">{label}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-eten-faint py-4 text-sm">{children}</p>;
}

/**
 * Member-growth chart. Both series are member counts, so they share one y-scale:
 * a cumulative area+line (the running total) with faint per-month "new" bars.
 * Hand-drawn SVG, dark-theme hex to match the console.
 */
function GrowthChart({
  data,
}: {
  data: { label: string; added: number; cumulative: number }[];
}) {
  if (data.length === 0) return <Empty>No data yet.</Empty>;

  const W = 640;
  const H = 240;
  const padL = 40;
  const padR = 14;
  const padT = 16;
  const padB = 28;
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
  const barW = Math.min(22, (innerW / n) * 0.4);
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
              stroke="#253145"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="10"
              fontFamily="monospace"
              fill="#778699"
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
          stroke="#253145"
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
              rx="2"
              fill="#4f86ec"
              fillOpacity="0.28"
            />
          );
        })}

        <path d={areaPath} fill="#4f86ec" fillOpacity="0.12" />
        <path
          d={linePath}
          fill="none"
          stroke="#4f86ec"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={x(n - 1)}
          cy={y(data[n - 1].cumulative)}
          r="4.5"
          fill="#6e9df0"
          stroke="#0f1622"
          strokeWidth="2"
        />

        {data.map((d, i) => (
          <text
            key={`lab-${i}`}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fontFamily="monospace"
            fill="#778699"
          >
            {d.label}
          </text>
        ))}
      </svg>

      <div className="text-eten-faint mt-2 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: "#4f86ec" }}
          />
          Cumulative
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: "rgba(79,134,236,0.28)" }}
          />
          New per month
        </span>
      </div>
    </div>
  );
}
