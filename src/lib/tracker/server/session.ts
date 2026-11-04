import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentMember, mfaPath, type MemberIdentity } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Role } from "@/lib/tracker/types";

/**
 * Who is using the real tracker, and in which roles (PRD section 5).
 *
 *   admin          members.role = 'operations'
 *   sales_manager  member_roles (migration 46)
 *   management     member_roles
 *   pod_leader     lead or co_lead of at least one pod (co_lead = backup)
 *   member         belongs to at least one specialist pod (an engineer)
 *
 * Roles are always resolved server-side; every page and server action gates on
 * this, never on anything the browser sends.
 */
export type TrackerSession = {
  member: MemberIdentity;
  roles: Role[];
  /** Pods this person leads (lead) or backs up (co_lead). */
  ledPodIds: string[];
  /** False when migrations 46/47 have not been run yet. */
  schemaReady: boolean;
  /**
   * Holds a staff role (Sales, Management or admin) but has not entered an
   * authenticator code this session. Staff roles are left out of `roles`
   * until they do (PRD FR-004).
   */
  mfaRequired: boolean;
};

const STAFF_ROLES: Role[] = ["sales_manager", "management", "admin"];

export const getTrackerSession = cache(
  async (): Promise<TrackerSession | null> => {
    const member = await getCurrentMember();
    if (!member || member.status !== "active") return null;

    const admin = getSupabaseAdmin();
    const [staff, pods] = await Promise.all([
      admin.from("member_roles").select("role").eq("member_id", member.id),
      admin
        .from("pod_memberships")
        .select("pod_id, role_in_pod, pods!inner(is_main)")
        .eq("member_id", member.id),
    ]);

    const roles = new Set<Role>();
    // A missing member_roles table means migration 46 has not been run.
    const schemaReady = !staff.error;
    for (const r of staff.data ?? []) {
      if (r.role === "sales_manager" || r.role === "management")
        roles.add(r.role);
    }
    if (member.role === "operations") roles.add("admin");

    const memberships = (pods.data ?? []) as unknown as {
      pod_id: string;
      role_in_pod: "member" | "lead" | "co_lead";
      pods: { is_main: boolean } | { is_main: boolean }[];
    }[];
    const specialist = memberships.filter((m) => {
      const p = Array.isArray(m.pods) ? m.pods[0] : m.pods;
      return !p?.is_main;
    });
    if (specialist.length > 0) roles.add("member");
    const ledPodIds = specialist
      .filter((m) => m.role_in_pod === "lead" || m.role_in_pod === "co_lead")
      .map((m) => m.pod_id);
    if (ledPodIds.length > 0) roles.add("pod_leader");

    // Staff access needs two-step sign-in. Until then the person keeps only
    // their engineer and Pod Leader roles, and pages send them to /mfa.
    const mfaRequired =
      member.aal !== "aal2" && STAFF_ROLES.some((r) => roles.has(r));
    if (mfaRequired) STAFF_ROLES.forEach((r) => roles.delete(r));

    return {
      member,
      roles: Array.from(roles),
      ledPodIds,
      schemaReady,
      mfaRequired,
    };
  },
);

export const hasRole = (s: TrackerSession, ...roles: Role[]) =>
  roles.some((r) => s.roles.includes(r));

/** Sales, Management or admin: may read across the whole tracker. */
export const isStaff = (s: TrackerSession) =>
  hasRole(s, "sales_manager", "management", "admin");

/** For pages: signed-in tracker users only; sends others to sign in. */
export async function requireTrackerSession(
  next = "/tracker",
): Promise<TrackerSession> {
  const s = await getTrackerSession();
  if (!s) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (s.mfaRequired) redirect(mfaPath(next));
  return s;
}

/**
 * For server actions: the session if the caller holds one of `roles`
 * (any role when none are given), otherwise an error to return to the UI.
 */
export async function authorizeTracker(
  ...roles: Role[]
): Promise<{ session: TrackerSession } | { error: string }> {
  const s = await getTrackerSession();
  if (!s) return { error: "Please sign in again." };
  if (s.mfaRequired)
    return { error: "Please finish two-step sign-in first, then try again." };
  if (!s.schemaReady)
    return { error: "The tracker database is not set up yet." };
  if (roles.length > 0 && !hasRole(s, ...roles)) {
    return { error: "You do not have permission to do that." };
  }
  return { session: s };
}
