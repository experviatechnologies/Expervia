/**
 * Read helpers over the tracker dataset: lookups, role checks, request
 * visibility and the pipeline counts shown on dashboards. Pure functions so
 * Phase 2 can reuse the same rules server-side.
 */
import { ACTIVE_STATUSES } from "./labels";
import type { Member, PresalesRequest, Role, TrackerData } from "./types";

export const has = (m: Member | null | undefined, role: Role) =>
  Boolean(m?.roles.includes(role));

export const isSales = (m: Member | null | undefined) =>
  has(m, "sales_manager") || has(m, "admin");

/** The primary role used for the persona label and dashboard variant. */
export function primaryRole(m: Member): Role {
  if (has(m, "admin")) return "admin";
  if (has(m, "management")) return "management";
  if (has(m, "sales_manager")) return "sales_manager";
  if (has(m, "pod_leader")) return "pod_leader";
  return "member";
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export function lookup(data: TrackerData) {
  const members = new Map(data.members.map((m) => [m.id, m]));
  const pods = new Map(data.pods.map((p) => [p.id, p]));
  const skills = new Map(data.skills.map((s) => [s.id, s]));
  const types = new Map(data.meetingTypes.map((t) => [t.id, t]));
  return {
    member: (id: string) => members.get(id),
    memberName: (id: string) =>
      id === "system" ? "System" : (members.get(id)?.name ?? "Unknown"),
    pod: (id: string) => pods.get(id),
    skill: (id: string) => skills.get(id),
    skillName: (id: string) => skills.get(id)?.name ?? id,
    meetingType: (id: string) => types.get(id)?.name ?? id,
  };
}

/** Engineers: active accounts with the member role. */
export const engineers = (data: TrackerData) =>
  data.members.filter(
    (m) => m.roles.includes("member") && m.status === "active",
  );

export const podsLedBy = (data: TrackerData, me: Member) =>
  data.pods.filter((p) => p.leaderId === me.id || p.backupLeaderId === me.id);

/** PRD section 5: who may open a request. */
export function canSeeRequest(
  data: TrackerData,
  me: Member,
  req: PresalesRequest,
) {
  if (isSales(me) || has(me, "management")) return true;
  if (req.status === "draft") return false;
  const led = podsLedBy(data, me).map((p) => p.id);
  if (
    req.access !== "restricted" &&
    req.routing.some((r) => led.includes(r.podId))
  )
    return true;
  return data.assignments.some(
    (a) => a.requestId === req.id && a.memberId === me.id,
  );
}

/**
 * Confidential requests hide the client from Pod Leaders until engineers are
 * selected; restricted requests show client details to Sales only.
 */
export function clientLabel(
  data: TrackerData,
  me: Member,
  req: PresalesRequest,
) {
  if (isSales(me) || has(me, "management") || req.access === "standard")
    return req.client;
  const selected = data.assignments.some(
    (a) =>
      a.requestId === req.id && a.memberId === me.id && a.status !== "replaced",
  );
  if (req.access === "confidential" && selected) return req.client;
  return req.access === "confidential"
    ? "Confidential client"
    : "Restricted client";
}

export const isActive = (r: PresalesRequest) =>
  ACTIVE_STATUSES.includes(r.status);

export function teamSummary(data: TrackerData, req: PresalesRequest) {
  const team = data.assignments.filter(
    (a) =>
      a.requestId === req.id &&
      !["replaced", "cancelled", "declined"].includes(a.status),
  );
  const accepted = team.filter((a) =>
    ["accepted", "confirmed", "attended", "absent"].includes(a.status),
  ).length;
  const nominated = data.nominations.filter(
    (n) => n.requestId === req.id && n.status !== "withdrawn",
  ).length;
  return { selected: team.length, accepted, nominated };
}

export function pipeline(data: TrackerData, now = Date.now()) {
  const reqs = data.requests;
  const count = (s: PresalesRequest["status"]) =>
    reqs.filter((r) => r.status === s).length;
  const overduePods = reqs
    .filter(isActive)
    .flatMap((r) => r.routing)
    .filter(
      (x) => x.status === "awaiting" && new Date(x.deadline).getTime() < now,
    ).length;
  const in14 = now + 14 * 86_400_000;
  return {
    open: reqs.filter(isActive).length,
    awaitingNominations: count("open"),
    nominationsReceived: count("nominations_received"),
    selection: count("selection"),
    awaitingAcceptance: count("awaiting_acceptance"),
    conflicts: count("conflict"),
    overduePods,
    confirmedUpcoming: reqs.filter(
      (r) =>
        r.status === "confirmed" &&
        new Date(r.startUtc).getTime() >= now &&
        new Date(r.startUtc).getTime() <= in14,
    ).length,
  };
}

/** Requests with a required skill that no current nominee or participant holds. */
export function coverageGaps(data: TrackerData) {
  return data.requests.filter(isActive).filter((r) => {
    const people = new Set([
      ...data.nominations
        .filter((n) => n.requestId === r.id)
        .map((n) => n.memberId),
      ...data.assignments
        .filter((a) => a.requestId === r.id)
        .map((a) => a.memberId),
    ]);
    if (people.size === 0) return false;
    const held = new Set(
      data.members
        .filter((m) => people.has(m.id))
        .flatMap((m) => m.skills.map((s) => s.skillId)),
    );
    return r.skillIds.some((s) => !held.has(s));
  });
}
