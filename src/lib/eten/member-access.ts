import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isOperations, type MemberIdentity } from "@/lib/auth";

/**
 * Who may see a member's private details (phone, CV), as agreed on the
 * details step: the member, ETEN staff (operations, with two-step sign-in)
 * and the Pod Leaders (lead or co-lead) of a specialist pod the member is in.
 */
export async function canSeePrivateDetails(
  viewer: MemberIdentity,
  targetId: string,
): Promise<"self" | "staff" | "pod_leader" | null> {
  if (viewer.status !== "active") return null;
  if (viewer.id === targetId) return "self";
  if (await isOperations()) return "staff";
  const admin = getSupabaseAdmin();
  const { data: led } = await admin
    .from("pod_memberships")
    .select("pod_id, pods!inner(is_main)")
    .eq("member_id", viewer.id)
    .in("role_in_pod", ["lead", "co_lead"])
    .eq("pods.is_main", false);
  const podIds = (led ?? []).map((r) => r.pod_id as string);
  if (!podIds.length) return null;
  const { count } = await admin
    .from("pod_memberships")
    .select("pod_id", { count: "exact", head: true })
    .eq("member_id", targetId)
    .in("pod_id", podIds);
  return count ? "pod_leader" : null;
}

/** Whether the viewer may export this pod's roster: its leaders and staff. */
export async function canExportPodRoster(
  viewer: MemberIdentity,
  podId: string,
): Promise<boolean> {
  if (viewer.status !== "active") return false;
  if (await isOperations()) return true;
  const { count } = await getSupabaseAdmin()
    .from("pod_memberships")
    .select("pod_id", { count: "exact", head: true })
    .eq("pod_id", podId)
    .eq("member_id", viewer.id)
    .in("role_in_pod", ["lead", "co_lead"]);
  return Boolean(count);
}
