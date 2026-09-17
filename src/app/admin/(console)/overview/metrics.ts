import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Overview analytics data layer (Phase 2, step 2.1). One call fetches every
 * figure the admin dashboard home shows, via service_role (the page is already
 * operations-gated). Steps 2.2 and 2.3 render these as cards, an activity feed
 * and charts.
 *
 * Note: the verification funnel is certification-based for now. Member identity
 * & address (KYC) verification arrives in Phase 6 and will feed this too.
 */

export type OverviewMetrics = {
  counts: {
    totalMembers: number;
    activeMembers: number;
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

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const admin = getSupabaseAdmin();
  const head = { count: "exact" as const, head: true };

  const [
    totalMembers,
    activeMembers,
    pendingActivation,
    suspendedMembers,
    posts,
    comments,
    certsSubmitted,
    certsPending,
    certsVerified,
    certsRejected,
    openReports,
    { data: podRows },
    { data: membershipRows },
    { data: memberDates },
    { data: auditRows },
  ] = await Promise.all([
    admin.from("members").select("*", head),
    admin
      .from("members")
      .select("*", head)
      .eq("status", "active")
      .not("claimed_at", "is", null),
    admin.from("members").select("*", head).is("claimed_at", null),
    admin.from("members").select("*", head).eq("status", "suspended"),
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
    admin.from("pods").select("id, name, is_main").order("name"),
    admin.from("pod_memberships").select("pod_id, member_id"),
    admin.from("members").select("created_at"),
    admin
      .from("audit_log")
      .select("id, action, target_type, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

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

  // Member growth over the last 8 months.
  const buckets = monthBuckets(8);
  const times = (memberDates ?? [])
    .map((r) => new Date(r.created_at).getTime())
    .filter((t) => !Number.isNaN(t));
  const growth = buckets.map((b) => ({
    label: b.label,
    added: times.filter((t) => t >= b.start && t < b.end).length,
    cumulative: times.filter((t) => t < b.end).length,
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
      totalMembers: totalMembers.count ?? 0,
      activeMembers: activeMembers.count ?? 0,
      pendingActivation: pendingActivation.count ?? 0,
      suspendedMembers: suspendedMembers.count ?? 0,
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
    recentActivity,
  };
}
