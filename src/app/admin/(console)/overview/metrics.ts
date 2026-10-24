import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Overview analytics data layer (Phase 2, step 2.1). One call fetches every
 * figure the admin dashboard home shows, via service_role (the page is already
 * operations-gated). Steps 2.2 and 2.3 render these as cards, an activity feed
 * and charts.
 *
 * Accuracy notes:
 *   - Member figures EXCLUDE the operations/staff accounts (role = operations),
 *     so "Total members" reflects the real community, not our own logins.
 *   - "Active" = has signed in at least once (claimed + not suspended).
 *     "Active (30d)" is true recency, read from auth.users.last_sign_in_at.
 *   - The growth chart's "new per month" bars count only self-serve sign-ups.
 *     Migrated legacy members were provisioned in bulk, so dating them by their
 *     account-creation time would invent a huge phantom spike in the migration
 *     month. They still count toward the cumulative total line (they are real
 *     members), which is why the line can step up more than the bars.
 *
 * The verification funnel is certification-based for now. Member identity &
 * address (KYC) verification arrives in Phase 6 and will feed this too.
 */

export type OverviewMetrics = {
  counts: {
    totalMembers: number;
    activeMembers: number;
    activeLast30: number;
    pendingActivation: number;
    suspendedMembers: number;
    multiPodMembers: number;
    podCount: number;
    certsToReview: number;
    openReports: number;
    posts: number;
    comments: number;
  };
  growth: { label: string; added: number; cumulative: number }[];
  pods: { name: string; members: number }[];
  verification: {
    submitted: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  kyc: {
    identityVerified: number;
    addressVerified: number;
    pending: number;
  };
  recentActivity: {
    id: string;
    action: string;
    actorName: string | null;
    targetType: string | null;
    createdAt: string;
  }[];
};

/** Last `n` calendar months as [start, end) windows, oldest first. */
function monthBuckets(n: number) {
  const now = new Date();
  const buckets: { label: string; start: number; end: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    buckets.push({
      label: start.toLocaleString("en-US", { month: "short" }),
      start: start.getTime(),
      end: end.getTime(),
    });
  }
  return buckets;
}

/** member id -> auth last_sign_in_at (ISO or null), paginated across all users. */
async function lastSignInById(
  admin: SupabaseClient,
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) map.set(u.id, u.last_sign_in_at ?? null);
    if (data.users.length < 1000) break;
  }
  return map;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const admin = getSupabaseAdmin();
  const head = { count: "exact" as const, head: true };
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 86_400_000;

  const [
    { data: memberRows },
    posts,
    comments,
    certsSubmitted,
    certsPending,
    certsVerified,
    certsRejected,
    openReports,
    idVerified,
    addrVerified,
    kycPending,
    { data: podRows },
    { data: membershipRows },
    { data: auditRows },
  ] = await Promise.all([
    // Pull members once and derive every member figure client-side so the
    // operations/staff accounts can be excluded consistently everywhere.
    admin
      .from("members")
      .select("id, role, status, origin, claimed_at, created_at"),
    admin.from("posts").select("*", head).eq("is_removed", false),
    admin.from("comments").select("*", head).eq("is_removed", false),
    admin.from("certifications").select("*", head),
    admin
      .from("certifications")
      .select("*", head)
      .eq("verification_status", "unverified"),
    admin
      .from("certifications")
      .select("*", head)
      .eq("verification_status", "verified"),
    admin
      .from("certifications")
      .select("*", head)
      .eq("verification_status", "rejected"),
    admin.from("reports").select("*", head).eq("status", "open"),
    admin
      .from("member_verifications")
      .select("*", head)
      .eq("kind", "identity")
      .eq("status", "verified"),
    admin
      .from("member_verifications")
      .select("*", head)
      .eq("kind", "address")
      .eq("status", "verified"),
    admin
      .from("member_verifications")
      .select("*", head)
      .eq("status", "unverified"),
    admin.from("pods").select("id, name, is_main").order("name"),
    admin.from("pod_memberships").select("pod_id, member_id"),
    admin
      .from("audit_log")
      .select("id, action, target_type, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Real community = everyone except our own operations/staff logins.
  const members = (memberRows ?? []).filter((m) => m.role !== "operations");
  const totalMembers = members.length;
  const activeMembers = members.filter(
    (m) => m.status === "active" && m.claimed_at,
  ).length;
  const pendingActivation = members.filter((m) => !m.claimed_at).length;
  const suspendedMembers = members.filter(
    (m) => m.status === "suspended",
  ).length;

  // True recency: how many real members actually signed in within 30 days.
  const lastSignIn = await lastSignInById(admin);
  const memberIdSet = new Set(members.map((m) => m.id));
  let activeLast30 = 0;
  for (const [id, ts] of lastSignIn) {
    if (!memberIdSet.has(id) || !ts) continue;
    if (now - Date.parse(ts) <= THIRTY_DAYS_MS) activeLast30 += 1;
  }

  // Per-pod counts + how many members belong to more than one pod.
  const podCounts = new Map<string, number>();
  const perMember = new Map<string, number>();
  for (const m of membershipRows ?? []) {
    podCounts.set(m.pod_id, (podCounts.get(m.pod_id) ?? 0) + 1);
    perMember.set(m.member_id, (perMember.get(m.member_id) ?? 0) + 1);
  }
  let multiPodMembers = 0;
  for (const count of perMember.values()) if (count > 1) multiPodMembers += 1;

  const pods = (podRows ?? [])
    .filter((p) => !p.is_main)
    .map((p) => ({ name: p.name, members: podCounts.get(p.id) ?? 0 }))
    .sort((a, b) => b.members - a.members);

  // Member growth over the last 8 months. Bars = new self-serve sign-ups
  // (migrated legacy members excluded so the import month isn't a phantom
  // spike). Line = cumulative real membership (migrated included, since they
  // are real members — this is why the line can rise faster than the bars).
  const buckets = monthBuckets(8);
  const parse = (iso: string) => new Date(iso).getTime();
  const addedTimes = members
    .filter((m) => m.origin !== "migrated")
    .map((m) => parse(m.created_at))
    .filter((t) => !Number.isNaN(t));
  const allTimes = members
    .map((m) => parse(m.created_at))
    .filter((t) => !Number.isNaN(t));
  const growth = buckets.map((b) => ({
    label: b.label,
    added: addedTimes.filter((t) => t >= b.start && t < b.end).length,
    cumulative: allTimes.filter((t) => t < b.end).length,
  }));

  // Resolve actor names for the recent-activity feed.
  const actorIds = [
    ...new Set((auditRows ?? []).map((a) => a.actor_id).filter(Boolean)),
  ] as string[];
  const nameById = new Map<string, string>();
  if (actorIds.length) {
    const { data: names } = await admin
      .from("profiles")
      .select("member_id, full_name")
      .in("member_id", actorIds);
    for (const n of names ?? []) nameById.set(n.member_id, n.full_name);
  }
  const recentActivity = (auditRows ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    actorName: a.actor_id ? (nameById.get(a.actor_id) ?? null) : null,
    targetType: a.target_type,
    createdAt: a.created_at,
  }));

  return {
    counts: {
      totalMembers,
      activeMembers,
      activeLast30,
      pendingActivation,
      suspendedMembers,
      multiPodMembers,
      podCount: pods.length,
      certsToReview: certsPending.count ?? 0,
      openReports: openReports.count ?? 0,
      posts: posts.count ?? 0,
      comments: comments.count ?? 0,
    },
    growth,
    pods,
    verification: {
      submitted: certsSubmitted.count ?? 0,
      pending: certsPending.count ?? 0,
      verified: certsVerified.count ?? 0,
      rejected: certsRejected.count ?? 0,
    },
    kyc: {
      identityVerified: idVerified.count ?? 0,
      addressVerified: addrVerified.count ?? 0,
      pending: kycPending.count ?? 0,
    },
    recentActivity,
  };
}
