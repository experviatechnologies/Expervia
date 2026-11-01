import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { provisionAndInvite } from "@/lib/eten/migration";
import { auditTracker, notifyPresales } from "./events";

/**
 * Pod roster import (PRD FR-005, Phase 3 step 3.5): reconcile ETEN against the
 * business's authoritative member list.
 *
 * CSV columns (header row required, any order, case-insensitive):
 *   full_name   required for new people
 *   email       required; the match key
 *   primary_pod required; pod slug or name (e.g. "security" or "Security")
 *   other_pods  optional; extra pods separated by ";" or "|"
 *   pod_role    optional; "lead" or "backup" for the PRIMARY pod
 *
 * Additive by design: missing pods are added and leadership set, but nobody
 * is removed from a pod because they are absent from the file. planRoster() is
 * read-only; applyRoster() recomputes the plan server-side before writing.
 */

export type RosterRow = {
  line: number;
  fullName: string;
  email: string;
  primaryPod: string;
  otherPods: string[];
  podRole: string;
};

export type PlannedRow = {
  line: number;
  fullName: string;
  email: string;
  status: "new" | "update" | "unchanged" | "error";
  memberId?: string;
  primaryPodId?: string;
  podIds: string[];
  addPodIds: string[];
  role?: "lead" | "co_lead";
  messages: string[];
};

export type RosterPlan = {
  rows: PlannedRow[];
  pods: { id: string; name: string }[];
  summary: {
    total: number;
    new: number;
    update: number;
    unchanged: number;
    error: number;
    leaders: number;
  };
};

const MAX_ROWS = 2000;
export const INVITE_BATCH = 50;
const INVITE_DELAY_MS = 600;

// ------------------------------------------------------------------ parsing

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const HEADER_ALIASES: Record<string, keyof Omit<RosterRow, "line">> = {
  full_name: "fullName",
  name: "fullName",
  "full name": "fullName",
  email: "email",
  "email address": "email",
  primary_pod: "primaryPod",
  "primary pod": "primaryPod",
  pod: "primaryPod",
  other_pods: "otherPods",
  "other pods": "otherPods",
  pod_role: "podRole",
  "pod role": "podRole",
  role: "podRole",
};

export function parseRoster(
  text: string,
): { rows: RosterRow[] } | { error: string } {
  const table = parseCsv(text);
  if (table.length < 2) return { error: "The file has no data rows." };
  if (table.length - 1 > MAX_ROWS)
    return {
      error: `The file has more than ${MAX_ROWS} rows. Split it into smaller files.`,
    };
  const header = table[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase()]);
  for (const need of ["email", "primaryPod"] as const) {
    if (!header.includes(need))
      return {
        error:
          "Required columns: full_name, email, primary_pod (other_pods and pod_role are optional).",
      };
  }
  const col = (r: string[], k: keyof Omit<RosterRow, "line">) => {
    const i = header.indexOf(k);
    return i >= 0 ? (r[i] ?? "").trim() : "";
  };
  return {
    rows: table.slice(1).map((r, i) => ({
      line: i + 2,
      fullName: col(r, "fullName"),
      email: col(r, "email").toLowerCase(),
      primaryPod: col(r, "primaryPod"),
      otherPods: col(r, "otherPods")
        .split(/[;|]/)
        .map((x) => x.trim())
        .filter(Boolean),
      podRole: col(r, "podRole").toLowerCase(),
    })),
  };
}

// ------------------------------------------------------------------ planning

async function authUserIds(
  admin: SupabaseClient,
): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Couldn't read accounts: ${error.message}`);
    for (const u of data.users)
      if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

async function fetchAll<T>(
  build: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export async function planRoster(
  admin: SupabaseClient,
  rows: RosterRow[],
): Promise<RosterPlan> {
  const [
    { data: podRows, error: podError },
    byEmail,
    members,
    memberships,
    profiles,
  ] = await Promise.all([
    admin.from("pods").select("id, slug, name, is_main"),
    authUserIds(admin),
    fetchAll<{ id: string; status: string; claimed_at: string | null }>(
      (a, b) =>
        admin
          .from("members")
          .select("id, status, claimed_at")
          .order("id")
          .range(a, b),
    ),
    fetchAll<{ pod_id: string; member_id: string; role_in_pod: string }>(
      (a, b) =>
        admin
          .from("pod_memberships")
          .select("pod_id, member_id, role_in_pod")
          .order("id")
          .range(a, b),
    ),
    fetchAll<{ member_id: string; full_name: string | null }>((a, b) =>
      admin
        .from("profiles")
        .select("member_id, full_name")
        .order("member_id")
        .range(a, b),
    ),
  ]);
  if (podError) throw new Error(podError.message);

  const pods = (podRows ?? []).filter((p) => !p.is_main);
  const podLookup = new Map<string, string>();
  for (const p of pods) {
    podLookup.set(norm(p.slug), p.id);
    podLookup.set(norm(p.name), p.id);
  }
  const findPod = (v: string) => podLookup.get(norm(v));
  const memberBy = new Map(members.map((m) => [m.id, m]));
  const nameBy = new Map(
    profiles.map((p) => [p.member_id, p.full_name ?? "a member"]),
  );
  const podsOf = new Map<string, Set<string>>();
  for (const m of memberships) {
    if (!podsOf.has(m.member_id)) podsOf.set(m.member_id, new Set());
    podsOf.get(m.member_id)!.add(m.pod_id);
  }
  const holder = (podId: string, role: string) =>
    memberships.find((m) => m.pod_id === podId && m.role_in_pod === role)
      ?.member_id;

  const seenEmail = new Set<string>();
  const claimedSlot = new Map<string, number>(); // `${pod}:${role}` -> line

  const planned = rows.map((r): PlannedRow => {
    const out: PlannedRow = {
      line: r.line,
      fullName: r.fullName,
      email: r.email,
      status: "unchanged",
      podIds: [],
      addPodIds: [],
      messages: [],
    };
    const fail = (msg: string) => ({
      ...out,
      status: "error" as const,
      messages: [msg],
    });

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))
      return fail("Missing or invalid email.");
    if (seenEmail.has(r.email))
      return fail("This email appears earlier in the file.");
    seenEmail.add(r.email);

    const primary = findPod(r.primaryPod);
    if (!primary)
      return fail(
        r.primaryPod
          ? `Unknown pod "${r.primaryPod}".`
          : "Missing primary_pod.",
      );
    const others: string[] = [];
    for (const o of r.otherPods) {
      const id = findPod(o);
      if (!id) return fail(`Unknown pod "${o}" in other_pods.`);
      if (id !== primary && !others.includes(id)) others.push(id);
    }
    out.primaryPodId = primary;
    out.podIds = [primary, ...others];

    let role: "lead" | "co_lead" | undefined;
    if (
      r.podRole === "lead" ||
      r.podRole === "leader" ||
      r.podRole === "pod leader"
    )
      role = "lead";
    else if (
      ["backup", "co_lead", "co-lead", "colead", "backup leader"].includes(
        r.podRole,
      )
    )
      role = "co_lead";
    else if (r.podRole && r.podRole !== "member")
      return fail(`Unknown pod_role "${r.podRole}" (use lead or backup).`);
    if (role) {
      const key = `${primary}:${role}`;
      if (claimedSlot.has(key))
        return fail(
          `Line ${claimedSlot.get(key)} already sets this pod's ${role === "lead" ? "Pod Leader" : "backup leader"}.`,
        );
      claimedSlot.set(key, r.line);
    }

    const memberId = byEmail.get(r.email);
    if (!memberId) {
      if (!r.fullName) return fail("New people need a full_name.");
      out.status = "new";
      out.addPodIds = out.podIds;
      out.messages.push(
        `New account, joins ${out.podIds.length} pod${out.podIds.length > 1 ? "s" : ""}.`,
      );
      if (role)
        out.messages.push(
          "Leadership can only be set once they activate their account; assign it then.",
        );
      return out;
    }

    out.memberId = memberId;
    const m = memberBy.get(memberId);
    if (!m || m.status !== "active")
      return fail(`Account is ${m?.status ?? "missing"}; not changed.`);
    const current = podsOf.get(memberId) ?? new Set<string>();
    out.addPodIds = out.podIds.filter((p) => !current.has(p));
    if (out.addPodIds.length)
      out.messages.push(
        `Joins ${out.addPodIds.length} more pod${out.addPodIds.length > 1 ? "s" : ""}.`,
      );

    if (role) {
      if (!m.claimed_at) {
        out.messages.push(
          "Not activated yet, so leadership is skipped; assign it once they activate.",
        );
      } else if (holder(primary, role) !== memberId) {
        out.role = role;
        const prev = holder(primary, role);
        out.messages.push(
          `Becomes ${role === "lead" ? "Pod Leader" : "backup leader"}${prev ? `, replacing ${nameBy.get(prev)}` : ""}.`,
        );
      }
    }
    out.status = out.addPodIds.length || out.role ? "update" : "unchanged";
    if (out.status === "unchanged") out.messages.push("Already up to date.");
    return out;
  });

  const count = (s: PlannedRow["status"]) =>
    planned.filter((p) => p.status === s).length;
  return {
    rows: planned,
    pods: pods.map((p) => ({ id: p.id, name: p.name })),
    summary: {
      total: planned.length,
      new: count("new"),
      update: count("update"),
      unchanged: count("unchanged"),
      error: count("error"),
      leaders: planned.filter((p) => p.role).length,
    },
  };
}

// ------------------------------------------------------------------ applying

export type ApplyReport = {
  created: number;
  invited: number;
  updated: number;
  leadersSet: number;
  remainingNew: number;
  failures: { email: string; error: string }[];
};

export async function applyRoster(
  admin: SupabaseClient,
  plan: RosterPlan,
  ctx: {
    actorId: string;
    resend: Resend;
    origin: string;
    fromEmail: string;
    sendInvites: boolean;
  },
): Promise<ApplyReport> {
  const report: ApplyReport = {
    created: 0,
    invited: 0,
    updated: 0,
    leadersSet: 0,
    remainingNew: 0,
    failures: [],
  };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Existing members: add missing pods (the 49 trigger creates presales profiles).
  for (const row of plan.rows.filter((r) => r.status === "update")) {
    try {
      if (row.addPodIds.length) {
        const { error } = await admin.from("pod_memberships").upsert(
          row.addPodIds.map((pod_id) => ({
            pod_id,
            member_id: row.memberId!,
            role_in_pod: "member",
          })),
          { onConflict: "pod_id,member_id", ignoreDuplicates: true },
        );
        if (error) throw new Error(error.message);
      }
      if (row.role) {
        // One holder per slot: the previous holder goes back to member.
        const { error: clearError } = await admin
          .from("pod_memberships")
          .update({ role_in_pod: "member" })
          .eq("pod_id", row.primaryPodId!)
          .eq("role_in_pod", row.role);
        if (clearError) throw new Error(clearError.message);
        const { error: setError } = await admin
          .from("pod_memberships")
          .update({ role_in_pod: row.role })
          .eq("pod_id", row.primaryPodId!)
          .eq("member_id", row.memberId!);
        if (setError) throw new Error(setError.message);
        report.leadersSet++;
        await auditTracker({
          actorId: ctx.actorId,
          action: "pod_leader_set",
          targetType: "pod",
          targetId: row.primaryPodId,
          reason: "Roster import",
          metadata: { slot: row.role, member_id: row.memberId },
        });
        await notifyPresales({
          recipients: [row.memberId],
          actorId: ctx.actorId,
          event: "pod_leader_assigned",
        });
      }
      report.updated++;
    } catch (e) {
      report.failures.push({
        email: row.email,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  // New people: provision in paced batches (auth + email rate limits).
  const fresh = plan.rows.filter((r) => r.status === "new");
  const batch = fresh.slice(0, INVITE_BATCH);
  report.remainingNew = fresh.length - batch.length;
  for (let i = 0; i < batch.length; i++) {
    const row = batch[i];
    try {
      const memberId = await provisionAndInvite(
        admin,
        ctx.resend,
        ctx.origin,
        ctx.fromEmail,
        {
          email: row.email,
          fullName: row.fullName,
          location: null,
          jobTitle: null,
          industryExperience: null,
          availabilityStatus: null,
          resumePath: null,
          fromApplication: false,
          fromEvent: false,
        },
        { send: ctx.sendInvites },
      );
      report.created++;
      if (ctx.sendInvites) report.invited++;
      await admin
        .from("profiles")
        .update({ primary_specialization_pod_id: row.primaryPodId })
        .eq("member_id", memberId);
      const { error } = await admin.from("pod_memberships").upsert(
        row.podIds.map((pod_id) => ({
          pod_id,
          member_id: memberId,
          role_in_pod: "member",
        })),
        { onConflict: "pod_id,member_id", ignoreDuplicates: true },
      );
      if (error) throw new Error(error.message);
    } catch (e) {
      report.failures.push({
        email: row.email,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
    if (i < batch.length - 1) await sleep(INVITE_DELAY_MS);
  }

  await auditTracker({
    actorId: ctx.actorId,
    action: "roster_imported",
    targetType: "member",
    reason: "Roster import",
    metadata: {
      ...plan.summary,
      ...report,
      failures: report.failures.length,
      sent_invites: ctx.sendInvites,
    },
  });
  return report;
}
