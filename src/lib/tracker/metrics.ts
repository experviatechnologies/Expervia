/**
 * Management KPIs (PRD section 11). Every figure is derived from records in
 * the tracker and returned with its numerator, denominator and definition so
 * the Reports page can show exactly how it was calculated.
 */
import { evaluateMember, hasDeclared, isFresh } from "./availability";
import { engineers, lookup } from "./selectors";
import { hoursBetween } from "./time";
import type { TrackerData } from "./types";

export type Metric = {
  key: string;
  label: string;
  value: string;
  sub: string;
  numerator?: number;
  denominator?: number;
  definition: string;
};

const pct = (n: number, d: number) =>
  d === 0 ? "n/a" : `${Math.round((n / d) * 100)}%`;

function median(xs: number[]) {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const fmtHours = (h: number | null) =>
  h === null
    ? "n/a"
    : h < 48
      ? `${Math.round(h * 10) / 10} h`
      : `${Math.round(h / 24)} d`;

export type MetricFilter = { from?: string; to?: string; podId?: string };

export function computeMetrics(
  data: TrackerData,
  f: MetricFilter = {},
  now = Date.now(),
) {
  const L = lookup(data);
  const fromMs = f.from ? new Date(`${f.from}T00:00:00Z`).getTime() : -Infinity;
  const toMs = f.to ? new Date(`${f.to}T23:59:59Z`).getTime() : Infinity;

  const people = engineers(data).filter(
    (m) => !f.podId || m.podId === f.podId || m.extraPodIds.includes(f.podId),
  );
  const declared = people.filter(hasDeclared).length;
  const fresh = people.filter((m) => isFresh(m, data.policies, now)).length;

  const reqs = data.requests.filter((r) => {
    if (r.status === "draft") return false;
    const t = new Date(r.startUtc).getTime();
    if (t < fromMs || t > toMs) return false;
    return !f.podId || r.routing.some((x) => x.podId === f.podId);
  });
  const reqIds = new Set(reqs.map((r) => r.id));

  const turnaround = reqs
    .filter((r) => r.submittedAt)
    .map((r) => {
      const responded = r.routing
        .filter((x) => x.respondedAt && (!f.podId || x.podId === f.podId))
        .map((x) => hoursBetween(r.submittedAt!, x.respondedAt!));
      return responded.length ? Math.min(...responded) : null;
    })
    .filter((x): x is number => x !== null && x >= 0);

  const assigns = data.assignments.filter((a) => reqIds.has(a.requestId));
  const responded = assigns.filter((a) => a.respondedAt);
  const onTime = responded.filter(
    (a) => new Date(a.respondedAt!).getTime() <= new Date(a.dueAt).getTime(),
  );

  const toConfirm = reqs
    .filter((r) => r.submittedAt && r.confirmedAt)
    .map((r) => hoursBetween(r.submittedAt!, r.confirmedAt!))
    .filter((h) => h >= 0);

  const attended = assigns.filter((a) => a.status === "attended").length;
  const absent = assigns.filter((a) => a.status === "absent").length;

  const checked = assigns.filter(
    (a) => !["replaced", "cancelled"].includes(a.status),
  );
  const conflicts = checked.filter((a) => {
    if (!["accepted", "confirmed", "invitation_pending"].includes(a.status))
      return false;
    const r = reqs.find((x) => x.id === a.requestId);
    const m = L.member(a.memberId);
    if (!r || !m || ["completed", "cancelled"].includes(r.status)) return false;
    return (
      evaluateMember(m, { ...r, requestId: r.id }, data).state === "conflict"
    );
  }).length;

  const staffed = reqs.filter((r) =>
    ["confirmed", "completed"].includes(r.status),
  );
  const covered = staffed.filter((r) => {
    const held = new Set(
      assigns
        .filter(
          (a) =>
            a.requestId === r.id &&
            !["replaced", "cancelled", "declined"].includes(a.status),
        )
        .flatMap(
          (a) => L.member(a.memberId)?.skills.map((s) => s.skillId) ?? [],
        ),
    );
    return r.skillIds.every((s) => held.has(s));
  }).length;

  const outcomes = reqs.filter((r) => r.outcome);
  const progressed = outcomes.filter(
    (r) => r.outcome!.tag === "progressed",
  ).length;
  const tm = median(turnaround);
  const cm = median(toConfirm);

  const metrics: Metric[] = [
    {
      key: "active",
      label: "Active members",
      value: String(people.length),
      sub: "Engineers with an active account",
      denominator: people.length,
      definition:
        "Accounts with the ETEN Member role and active status (in the selected pod, if any).",
    },
    {
      key: "completion",
      label: "Availability completion",
      value: pct(declared, people.length),
      sub: `${declared} of ${people.length}`,
      numerator: declared,
      denominator: people.length,
      definition:
        "Active members with at least one active weekly availability window.",
    },
    {
      key: "freshness",
      label: "Availability freshness",
      value: pct(fresh, people.length),
      sub: `${fresh} of ${people.length}`,
      numerator: fresh,
      denominator: people.length,
      definition: `Active members who reviewed their availability in the last ${data.policies.freshDays} days.`,
    },
    {
      key: "turnaround",
      label: "Median nomination turnaround",
      value: fmtHours(tm),
      sub: `${turnaround.length} requests measured`,
      denominator: turnaround.length,
      definition:
        "Time from submitting a request to the first Pod Leader response (nomination or no suitable candidate).",
    },
    {
      key: "response",
      label: "On-time invitation responses",
      value: pct(onTime.length, responded.length),
      sub: `${onTime.length} of ${responded.length}`,
      numerator: onTime.length,
      denominator: responded.length,
      definition:
        "Invitations accepted or declined before the response deadline.",
    },
    {
      key: "confirm",
      label: "Median time to confirm",
      value: fmtHours(cm),
      sub: `${toConfirm.length} meetings measured`,
      denominator: toConfirm.length,
      definition:
        "Time from submitting a request to confirming the full presales team.",
    },
    {
      key: "attendance",
      label: "Attendance rate",
      value: pct(attended, attended + absent),
      sub: `${attended} of ${attended + absent}`,
      numerator: attended,
      denominator: attended + absent,
      definition:
        "Participants marked attended out of all participants with recorded attendance.",
    },
    {
      key: "conflict",
      label: "Conflict rate",
      value: pct(conflicts, checked.length),
      sub: `${conflicts} of ${checked.length}`,
      numerator: conflicts,
      denominator: checked.length,
      definition:
        "Current participants with a hard conflict (another commitment or a busy calendar) out of all participants.",
    },
    {
      key: "coverage",
      label: "Specialist coverage",
      value: pct(covered, staffed.length),
      sub: `${covered} of ${staffed.length}`,
      numerator: covered,
      denominator: staffed.length,
      definition:
        "Confirmed or completed meetings where the team holds every required skill.",
    },
    {
      key: "progressed",
      label: "Meetings progressed",
      value: pct(progressed, outcomes.length),
      sub: `${progressed} of ${outcomes.length}`,
      numerator: progressed,
      denominator: outcomes.length,
      definition:
        "Recorded outcomes tagged as progressed. Only meetings with a recorded outcome count.",
    },
  ];

  const byPod = data.pods
    .map((p) => ({
      label: p.name,
      value: reqs.filter((r) => r.routing.some((x) => x.podId === p.id)).length,
    }))
    .filter((x) => !f.podId || x.label === L.pod(f.podId)?.name)
    .sort((a, b) => b.value - a.value);

  const months = new Map<string, number>();
  for (const r of reqs
    .filter((x) => ["confirmed", "completed"].includes(x.status))
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc))) {
    const k = new Date(r.startUtc).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "Africa/Lagos",
    });
    months.set(k, (months.get(k) ?? 0) + 1);
  }

  return {
    metrics,
    byPod,
    byMonth: Array.from(months, ([label, value]) => ({ label, value })),
  };
}
