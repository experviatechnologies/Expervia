"use client";

/**
 * Role-specific dashboards (PRD section 11): Sales Manager pipeline, Pod
 * Leader nomination inbox, member participation, management KPIs and the
 * administrator's system view. A persona with several roles (a Pod Leader is
 * also a member) sees each relevant section.
 */
import Link from "next/link";
import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/tracker/store";
import {
  has,
  isSales,
  coverageGaps,
  engineers,
  lookup,
  pipeline,
  podsLedBy,
  teamSummary,
} from "@/lib/tracker/selectors";
import {
  hasDeclared,
  isFresh,
  weeklyMinutes,
} from "@/lib/tracker/availability";
import { computeMetrics } from "@/lib/tracker/metrics";
import {
  CALENDAR_STATUS,
  OUTCOME_TAG,
  ROUTING_STATUS,
} from "@/lib/tracker/labels";
import { fmtAgo, fmtDateTime, fmtRange } from "@/lib/tracker/time";
import type { Assignment, Member, PresalesRequest } from "@/lib/tracker/types";
import {
  Btn,
  Card,
  EmptyState,
  PageHeader,
  Pill,
  SectionLabel,
  Stat,
  Table,
  td,
  th,
} from "@/components/tracker/ui";
import {
  BarList,
  DueBadge,
  FormatPills,
  MeetingMeta,
  RefLink,
  RespondDialog,
  StatusPill,
  requestHref,
} from "@/components/tracker/bits";
import { BASE } from "@/components/tracker/shell";

export function DashboardView() {
  const { me } = useSession();
  const first = me.name.split(" ")[0];
  const engineer = me.roles.includes("member");
  return (
    <>
      <PageHeader
        title={`Welcome back, ${first}`}
        description="Your presales coordination at a glance."
        actions={
          has(me, "sales_manager") ? (
            <Btn href={`${BASE}/requests/new`} variant="primary">
              <Plus className="size-4" /> New presales request
            </Btn>
          ) : undefined
        }
      />
      <div className="space-y-8">
        {has(me, "admin") && <AdminSection />}
        {has(me, "management") && <ManagementSection />}
        {isSales(me) && !has(me, "admin") && <SalesSection />}
        {has(me, "pod_leader") && <PodLeaderSection />}
        {engineer && <MemberSection me={me} />}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ sales

function SalesSection() {
  const { data, me, now } = useSession();
  const p = pipeline(data, now);
  const L = lookup(data);
  const mine = data.requests;
  const needsAction = mine
    .filter((r) => {
      if (["nominations_received", "selection", "conflict"].includes(r.status))
        return true;
      if (r.status === "awaiting_acceptance") {
        const t = teamSummary(data, r);
        return t.accepted >= r.needed;
      }
      return false;
    })
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  const upcoming = data.requests
    .filter(
      (r) =>
        r.status === "confirmed" &&
        new Date(r.startUtc).getTime() >= now &&
        new Date(r.startUtc).getTime() <= now + 14 * 86_400_000,
    )
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  const outcomes = data.requests
    .filter((r) => r.outcome)
    .sort((a, b) => b.outcome!.recordedAt.localeCompare(a.outcome!.recordedAt))
    .slice(0, 4);
  const outcomeNeeded = data.requests.filter(
    (r) => r.status === "confirmed" && new Date(r.endUtc).getTime() < now,
  );
  const gaps = coverageGaps(data);
  const q = (stage: string) => `${BASE}/requests?stage=${stage}`;

  return (
    <section>
      <SectionLabel>Presales pipeline</SectionLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <Stat label="Open requests" value={p.open} href={`${BASE}/requests`} />
        <Stat
          label="Awaiting nominations"
          value={p.awaitingNominations}
          href={q("open")}
        />
        <Stat
          label="Nominations received"
          value={p.nominationsReceived}
          href={q("nominations_received")}
        />
        <Stat
          label="Selection in progress"
          value={p.selection}
          href={q("selection")}
        />
        <Stat
          label="Awaiting acceptance"
          value={p.awaitingAcceptance}
          href={q("awaiting_acceptance")}
        />
        <Stat
          label="Conflicts"
          value={p.conflicts}
          tone={p.conflicts ? "danger" : undefined}
          href={q("conflict")}
        />
        <Stat
          label="Overdue pod responses"
          value={p.overduePods}
          tone={p.overduePods ? "danger" : undefined}
        />
        <Stat
          label="Confirmed upcoming"
          value={p.confirmedUpcoming}
          href={`${BASE}/meetings`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Needs your action"
          description="Nominations to review, selections to finish, conflicts and teams ready to confirm."
          bodyClassName=""
        >
          {needsAction.length === 0 ? (
            <EmptyState title="Nothing needs you right now">
              New nominations and responses will appear here.
            </EmptyState>
          ) : (
            <Table label="Requests needing action">
              <thead className="border-eten-line border-b">
                <tr>
                  <th className={th}>Request</th>
                  <th className={th}>Meeting</th>
                  <th className={th}>Status</th>
                  <th className={th}>Team</th>
                </tr>
              </thead>
              <tbody>
                {needsAction.map((r) => {
                  const t = teamSummary(data, r);
                  const ready = r.status === "awaiting_acceptance";
                  return (
                    <tr
                      key={r.id}
                      className="border-eten-line-soft hover:bg-eten-hover/50 border-b last:border-0"
                    >
                      <td className={`${td} min-w-[220px]`}>
                        <Link
                          href={requestHref(
                            r.id,
                            ready ? "team" : "nominations",
                          )}
                          className="hover:text-eten-accent font-semibold"
                        >
                          {r.title}
                        </Link>
                        <p className="text-eten-faint text-[12.5px]">
                          {r.ref} · {r.client}
                        </p>
                      </td>
                      <td className={`${td} text-[13px] whitespace-nowrap`}>
                        {fmtRange(r.startUtc, r.endUtc, r.timezone)}
                      </td>
                      <td className={td}>
                        {ready ? (
                          <Pill tone="success">Ready to confirm</Pill>
                        ) : (
                          <StatusPill status={r.status} />
                        )}
                      </td>
                      <td className={`${td} text-[13px] whitespace-nowrap`}>
                        {t.accepted}/{r.needed} accepted
                        <span className="text-eten-faint block">
                          {t.nominated} nominated
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          {gaps.length > 0 && (
            <div className="border-eten-line border-t px-5 py-4">
              <p className="text-[13.5px] font-bold">
                Requests with missing technical coverage
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px]">
                {gaps.map((r) => {
                  const people = new Set([
                    ...data.nominations
                      .filter((n) => n.requestId === r.id)
                      .map((n) => n.memberId),
                    ...data.assignments
                      .filter((a) => a.requestId === r.id)
                      .map((a) => a.memberId),
                  ]);
                  const held = new Set(
                    data.members
                      .filter((m) => people.has(m.id))
                      .flatMap((m) => m.skills.map((s) => s.skillId)),
                  );
                  return (
                    <li key={r.id}>
                      <RefLink req={r} /> {r.title}:{" "}
                      <span className="text-trk-warn">
                        no{" "}
                        {r.skillIds
                          .filter((s) => !held.has(s))
                          .map(L.skillName)
                          .join(", ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card
            title="Confirmed meetings, next two weeks"
            action={
              <Link
                href={`${BASE}/meetings`}
                className="text-eten-accent text-[13.5px] font-semibold"
              >
                All meetings
              </Link>
            }
            bodyClassName=""
          >
            {upcoming.length === 0 ? (
              <EmptyState title="No confirmed meetings yet" />
            ) : (
              <ul>
                {upcoming.map((r) => (
                  <li
                    key={r.id}
                    className="border-eten-line-soft border-b px-5 py-3.5 last:border-0"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RefLink req={r} />
                      <FormatPills req={r} />
                    </div>
                    <Link
                      href={requestHref(r.id)}
                      className="hover:text-eten-accent mt-1 block font-bold"
                    >
                      {r.title}
                    </Link>
                    <MeetingMeta req={r} />
                    <p className="text-eten-faint mt-0.5 text-[12.5px]">
                      {data.assignments
                        .filter(
                          (a) =>
                            a.requestId === r.id && a.status === "confirmed",
                        )
                        .map((a) => L.memberName(a.memberId))
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {outcomeNeeded.length > 0 && (
            <Card title="Outcomes to record" bodyClassName="">
              <ul>
                {outcomeNeeded.map((r) => (
                  <li
                    key={r.id}
                    className="border-eten-line-soft flex items-center justify-between gap-3 border-b px-5 py-3 last:border-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {r.title}
                      </span>
                      <MeetingMeta req={r} />
                    </span>
                    <Btn size="sm" href={requestHref(r.id, "outcome")}>
                      Record
                    </Btn>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <OutcomesCard outcomes={outcomes} />
        </div>
      </div>
      {me.roles.includes("member") && <div className="mt-8" />}
    </section>
  );
}

function OutcomesCard({ outcomes }: { outcomes: PresalesRequest[] }) {
  return (
    <Card title="Recent meeting outcomes" bodyClassName="">
      {outcomes.length === 0 ? (
        <EmptyState title="No outcomes recorded yet" />
      ) : (
        <ul>
          {outcomes.map((r) => {
            const tag = OUTCOME_TAG[r.outcome!.tag];
            return (
              <li
                key={r.id}
                className="border-eten-line-soft border-b px-5 py-3.5 last:border-0"
              >
                <Link
                  href={requestHref(r.id, "outcome")}
                  className="hover:text-eten-accent font-bold"
                >
                  {r.title}
                </Link>
                <p className="text-eten-ink-muted mt-0.5 text-[13px]">
                  {r.outcome!.summary}
                </p>
                <Pill tone={tag.tone} className="mt-1.5">
                  {tag.label}
                </Pill>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ pod leader

function PodLeaderSection() {
  const { data, me } = useSession();
  const pods = podsLedBy(data, me);
  const podIds = pods.map((p) => p.id);
  const L = lookup(data);
  const awaiting = data.requests
    .filter((r) => !["draft", "cancelled", "completed"].includes(r.status))
    .flatMap((r) =>
      r.routing
        .filter((x) => podIds.includes(x.podId) && x.status === "awaiting")
        .map((x) => ({ r, x })),
    )
    .sort((a, b) => a.x.deadline.localeCompare(b.x.deadline));
  const recent = data.nominations
    .filter((n) => podIds.includes(n.podId))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);
  const needsReplacement = data.assignments.filter((a) => {
    if (a.status !== "declined") return false;
    const m = L.member(a.memberId);
    const r = data.requests.find((x) => x.id === a.requestId);
    return (
      m &&
      podIds.includes(m.podId) &&
      r &&
      !["completed", "cancelled", "confirmed"].includes(r.status)
    );
  });

  return (
    <section>
      <SectionLabel>Pod leadership</SectionLabel>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card
            title="Requests awaiting your nominations"
            action={
              <Link
                href={`${BASE}/nominations`}
                className="text-eten-accent text-[13.5px] font-semibold"
              >
                Nominations inbox
              </Link>
            }
            bodyClassName=""
          >
            {awaiting.length === 0 ? (
              <EmptyState title="You are up to date">
                New requests routed to your pod will appear here.
              </EmptyState>
            ) : (
              <ul>
                {awaiting.map(({ r, x }) => (
                  <li
                    key={`${r.id}-${x.podId}`}
                    className="border-eten-line-soft flex flex-wrap items-center gap-3 border-b px-5 py-3.5 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RefLink req={r} />
                        {r.urgency === "urgent" && (
                          <Pill tone="danger">Urgent</Pill>
                        )}
                        <Pill tone={ROUTING_STATUS[x.status].tone}>
                          {ROUTING_STATUS[x.status].label}
                        </Pill>
                      </div>
                      <Link
                        href={requestHref(r.id, "nominations")}
                        className="hover:text-eten-accent mt-1 block font-bold"
                      >
                        {r.title}
                      </Link>
                      <p className="text-eten-ink-muted text-[13px]">
                        {L.pod(x.podId)?.name} · needs {r.needed} ·{" "}
                        {fmtRange(r.startUtc, r.endUtc, r.timezone)}
                      </p>
                    </div>
                    <DueBadge due={x.deadline} />
                    <Btn
                      size="sm"
                      variant="primary"
                      href={requestHref(r.id, "nominations")}
                    >
                      Nominate
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {needsReplacement.length > 0 && (
            <Card
              title="Replacement needed"
              description="An engineer from your pod declined. Nominate someone else."
              bodyClassName=""
            >
              <ul>
                {needsReplacement.map((a) => {
                  const r = data.requests.find((x) => x.id === a.requestId)!;
                  return (
                    <li
                      key={a.id}
                      className="border-eten-line-soft flex items-center justify-between gap-3 border-b px-5 py-3 last:border-0"
                    >
                      <span>
                        <span className="font-semibold">
                          {L.memberName(a.memberId)}
                        </span>{" "}
                        declined {r.title}
                        {a.declineReason && (
                          <span className="text-eten-faint block text-[12.5px]">
                            {a.declineReason}
                          </span>
                        )}
                      </span>
                      <Btn size="sm" href={requestHref(r.id, "nominations")}>
                        Nominate
                      </Btn>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
          <Card title="Recent nominations from your pod" bodyClassName="">
            {recent.length === 0 ? (
              <EmptyState title="No nominations yet" />
            ) : (
              <ul>
                {recent.map((n) => {
                  const r = data.requests.find((x) => x.id === n.requestId)!;
                  return (
                    <li
                      key={n.id}
                      className="border-eten-line-soft flex items-center justify-between gap-3 border-b px-5 py-3 text-[14px] last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="font-semibold">
                          {L.memberName(n.memberId)}
                        </span>{" "}
                        for{" "}
                        <Link
                          href={requestHref(r.id)}
                          className="hover:text-eten-accent"
                        >
                          {r.title}
                        </Link>
                      </span>
                      <span className="text-eten-faint shrink-0 text-[12.5px]">
                        {fmtAgo(n.at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          {pods.map((pod) => {
            const people = engineers(data).filter((m) => m.podId === pod.id);
            const fresh = people.filter((m) =>
              isFresh(m, data.policies),
            ).length;
            const cal = people.filter((m) => m.calendar === "connected").length;
            const declared = people.filter(hasDeclared).length;
            return (
              <Card
                key={pod.id}
                title={pod.name}
                description={`${people.length} active members${pod.leaderId === me.id ? "" : " · you are the backup leader"}`}
              >
                <div className="space-y-3.5">
                  <Meter
                    label="Availability reviewed recently"
                    n={fresh}
                    d={people.length}
                  />
                  <Meter label="Calendar connected" n={cal} d={people.length} />
                  <Meter
                    label="Declared weekly availability"
                    n={declared}
                    d={people.length}
                  />
                </div>
                <Btn
                  size="sm"
                  className="mt-4"
                  href={`${BASE}/directory?pod=${pod.id}`}
                >
                  View pod members <ArrowRight className="size-3.5" />
                </Btn>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Meter({ label, n, d }: { label: string; n: number; d: number }) {
  const pct = d ? Math.round((n / d) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[13.5px]">
        <span>{label}</span>
        <span className="font-bold tabular-nums">
          {n}/{d}
        </span>
      </div>
      <div
        className="bg-eten-line-soft mt-1.5 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="bg-eten-accent h-full rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ member

function MemberSection({ me }: { me: Member }) {
  const { data, now } = useSession();
  const [responding, setResponding] = useState<Assignment | null>(null);
  const mine = data.assignments.filter((a) => a.memberId === me.id);
  const reqOf = (a: Assignment) =>
    data.requests.find((r) => r.id === a.requestId)!;
  const pending = mine.filter(
    (a) =>
      a.status === "invitation_pending" &&
      !["cancelled", "completed"].includes(reqOf(a).status),
  );
  const upcoming = mine
    .filter(
      (a) =>
        ["accepted", "confirmed"].includes(a.status) &&
        new Date(reqOf(a).endUtc).getTime() > now,
    )
    .sort((a, b) => reqOf(a).startUtc.localeCompare(reqOf(b).startUtc));
  const mins = weeklyMinutes(me);
  const fresh = isFresh(me, data.policies, now);
  const cal = CALENDAR_STATUS[me.calendar];
  const actions = [
    ...pending.map((a) => ({
      key: a.id,
      text: `Respond to ${reqOf(a).ref} invitation`,
      due: a.dueAt,
      href: undefined as string | undefined,
      a,
    })),
    ...(!fresh
      ? [
          {
            key: "review",
            text: "Review your weekly availability",
            due: undefined,
            href: `${BASE}/availability`,
            a: undefined,
          },
        ]
      : []),
    ...(me.calendar !== "connected" && me.calendar !== "none"
      ? [
          {
            key: "cal",
            text: "Reconnect your calendar",
            due: undefined,
            href: `${BASE}/settings?tab=calendar`,
            a: undefined,
          },
        ]
      : []),
  ];

  return (
    <section>
      <SectionLabel>My participation</SectionLabel>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Declared per week"
          value={`${Math.round(mins / 6) / 10} h`}
          sub={`${me.weekly.filter((w) => w.active).length} time windows`}
          href={`${BASE}/availability`}
        />
        <Stat
          label="Availability reviewed"
          value={me.reviewedAt ? fmtAgo(me.reviewedAt) : "Never"}
          sub={fresh ? "Up to date" : "Out of date"}
          tone={fresh ? undefined : "danger"}
          href={`${BASE}/availability`}
        />
        <Stat
          label="Pending invitations"
          value={pending.length}
          href={`${BASE}/meetings`}
        />
        <Stat
          label="Upcoming meetings"
          value={upcoming.length}
          href={`${BASE}/meetings?tab=upcoming`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {pending.map((a) => {
            const r = reqOf(a);
            return (
              <div
                key={a.id}
                className="border-trk-warn/30 bg-trk-warn-soft flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Invitation: {r.title}</p>
                  <p className="text-eten-ink-muted text-[13px]">
                    {r.ref} · {fmtRange(r.startUtc, r.endUtc, me.timezone)} ·{" "}
                    {r.format === "online" ? "Online" : r.location || r.format}
                  </p>
                </div>
                <DueBadge due={a.dueAt} />
                <Btn
                  variant="primary"
                  size="sm"
                  onClick={() => setResponding(a)}
                >
                  Respond
                </Btn>
              </div>
            );
          })}
          <Card title="My upcoming meetings" bodyClassName="">
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming meetings">
                When you are confirmed for a client meeting it appears here.
              </EmptyState>
            ) : (
              <ul>
                {upcoming.map((a) => {
                  const r = reqOf(a);
                  return (
                    <li
                      key={a.id}
                      className="border-eten-line-soft border-b px-5 py-3.5 last:border-0"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RefLink req={r} />
                        <FormatPills req={r} />
                        {a.status === "accepted" && (
                          <Pill tone="warning">Awaiting confirmation</Pill>
                        )}
                      </div>
                      <Link
                        href={requestHref(r.id)}
                        className="hover:text-eten-accent mt-1 block font-bold"
                      >
                        {r.title}
                      </Link>
                      <MeetingMeta req={r} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Required actions" bodyClassName="">
            {actions.length === 0 ? (
              <EmptyState title="No actions needed">
                Your profile, availability and invitations are up to date.
              </EmptyState>
            ) : (
              <ul>
                {actions.map((x) => (
                  <li
                    key={x.key}
                    className="border-eten-line-soft flex items-center justify-between gap-3 border-b px-5 py-3 text-[14px] last:border-0"
                  >
                    {x.a ? (
                      <button
                        type="button"
                        className="hover:text-eten-accent text-left font-semibold"
                        onClick={() => setResponding(x.a!)}
                      >
                        {x.text}
                      </button>
                    ) : (
                      <Link
                        href={x.href!}
                        className="hover:text-eten-accent font-semibold"
                      >
                        {x.text}
                      </Link>
                    )}
                    {x.due && <DueBadge due={x.due} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card
            title="Calendar"
            action={
              <Link
                href={`${BASE}/settings?tab=calendar`}
                className="text-eten-accent text-[13.5px] font-semibold"
              >
                Manage
              </Link>
            }
          >
            <Pill tone={cal.tone}>{cal.label}</Pill>
            <p className="text-eten-ink-muted mt-2 text-[13.5px]">
              {me.calendar === "connected"
                ? "We check your free/busy times before you are selected and add confirmed meetings to your calendar. Event details stay private."
                : me.calendar === "none"
                  ? "Without a calendar, conflicts cannot be verified and you are shown as declared availability only."
                  : "Your calendar authorisation is no longer valid, so conflicts cannot be checked. Reconnect to restore verification."}
            </p>
          </Card>
        </div>
      </div>
      <RespondDialog
        assignment={responding}
        onClose={() => setResponding(null)}
      />
    </section>
  );
}

// ------------------------------------------------------------------ management

function ManagementSection() {
  const { data } = useSession();
  const { metrics, byPod } = computeMetrics(data);
  const pick = [
    "active",
    "completion",
    "freshness",
    "turnaround",
    "response",
    "attendance",
    "conflict",
    "coverage",
  ];
  const p = pipeline(data);
  const outcomes = data.requests
    .filter((r) => r.outcome)
    .sort((a, b) => b.outcome!.recordedAt.localeCompare(a.outcome!.recordedAt))
    .slice(0, 4);
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionLabel>ETEN operational overview</SectionLabel>
        <span className="text-eten-faint mb-3 text-[12.5px]">
          Calculated from demo data, not real Expervia metrics
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics
          .filter((m) => pick.includes(m.key))
          .map((m) => (
            <Stat
              key={m.key}
              label={m.label}
              value={m.value}
              sub={m.sub}
              href={`${BASE}/reports#${m.key}`}
            />
          ))}
      </div>
      <div className="mt-4">
        <Btn href={`${BASE}/reports`}>
          Open full reports <ArrowRight className="size-4" />
        </Btn>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Presales pipeline" description="Active requests by stage.">
          <BarList
            rows={[
              { label: "Awaiting nominations", value: p.awaitingNominations },
              { label: "Nominations received", value: p.nominationsReceived },
              { label: "Selection in progress", value: p.selection },
              { label: "Awaiting acceptance", value: p.awaitingAcceptance },
              { label: "Conflict resolution", value: p.conflicts },
              {
                label: "Confirmed, next two weeks",
                value: p.confirmedUpcoming,
              },
            ]}
          />
        </Card>
        <Card
          title="Requests by pod"
          description="Requests routed to each pod."
        >
          <BarList rows={byPod} />
        </Card>
        <OutcomesCard outcomes={outcomes} />
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ admin

function AdminSection() {
  const { data } = useSession();
  const L = lookup(data);
  const accounts = data.members;
  const active = accounts.filter((m) => m.status === "active").length;
  const invited = accounts.filter((m) => m.status === "invited").length;
  const off = accounts.filter(
    (m) => m.status === "suspended" || m.status === "deactivated",
  ).length;
  const failed = data.jobs.filter((j) => j.status === "failed");
  const calIssues = engineers(data).filter((m) =>
    ["expired", "revoked", "error"].includes(m.calendar),
  ).length;
  const stale = engineers(data).filter(
    (m) => !isFresh(m, data.policies),
  ).length;
  const s = (tab: string) => `${BASE}/settings?tab=${tab}`;
  return (
    <section>
      <SectionLabel>Administration</SectionLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active accounts" value={active} href={s("users")} />
        <Stat
          label="Invited, not activated"
          value={invited}
          href={s("users")}
        />
        <Stat label="Suspended or deactivated" value={off} href={s("users")} />
        <Stat
          label="Failed background jobs"
          value={failed.length}
          tone={failed.length ? "danger" : undefined}
          href={s("health")}
        />
        <Stat
          label="Calendar connection issues"
          value={calIssues}
          tone={calIssues ? "danger" : undefined}
          href={s("health")}
        />
        <Stat
          label="Stale availability"
          value={stale}
          href={`${BASE}/directory?record=stale`}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card
          title="Failed jobs"
          action={
            <Link
              href={s("health")}
              className="text-eten-accent text-[13.5px] font-semibold"
            >
              System health
            </Link>
          }
          bodyClassName=""
        >
          {failed.length === 0 ? (
            <EmptyState title="No failed jobs" />
          ) : (
            <ul>
              {failed.map((j) => (
                <li
                  key={j.id}
                  className="border-eten-line-soft border-b px-5 py-3 last:border-0"
                >
                  <p className="font-semibold">{j.label}</p>
                  <p className="text-trk-danger text-[13px]">{j.error}</p>
                  <p className="text-eten-faint text-[12.5px]">
                    {fmtAgo(j.at)} · {j.attempts} attempt
                    {j.attempts > 1 ? "s" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title="Recent audit events"
          action={
            <Link
              href={s("audit")}
              className="text-eten-accent text-[13.5px] font-semibold"
            >
              Audit log
            </Link>
          }
          bodyClassName=""
        >
          <ul>
            {data.audit.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="border-eten-line-soft border-b px-5 py-3 text-[14px] last:border-0"
              >
                <span className="font-semibold">{L.memberName(e.actorId)}</span>{" "}
                {e.action.toLowerCase()} · {e.target}
                <span className="text-eten-faint block text-[12.5px]">
                  {fmtDateTime(e.at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
