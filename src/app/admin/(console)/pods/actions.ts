"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { auditTracker, notifyPresales } from "@/lib/tracker/server/events";

type ActionResult = { ok: true } | { error: string };
type Slot = "lead" | "co_lead";

/**
 * Set (or clear) a pod's Lead or backup leader (co_lead). Pod Leaders receive
 * presales nomination requests for their pod (PRD section 5), so every pod
 * needs one. Ops-only, re-verified here; a written reason is required and the
 * change is audit-logged.
 *
 * One person per slot: the previous holder of the slot goes back to member.
 * If the chosen person currently holds the other slot, they move across and
 * that slot becomes empty.
 */
export async function setPodLeader(input: {
  podId: string;
  slot: Slot;
  memberId: string | null;
  reason: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage pods." };
  }
  if (input.slot !== "lead" && input.slot !== "co_lead") {
    return { error: "Invalid leadership slot." };
  }
  const reason = input.reason?.trim() ?? "";
  if (reason.length < 3)
    return { error: "Please give a reason for this change." };

  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const { data: pod } = await admin
    .from("pods")
    .select("id, slug, is_main")
    .eq("id", input.podId)
    .maybeSingle();
  if (!pod) return { error: "Pod not found." };
  if (pod.is_main)
    return { error: "The Main Community has no pod leadership." };

  if (input.memberId) {
    const [{ data: membership }, { data: member }] = await Promise.all([
      admin
        .from("pod_memberships")
        .select("id, role_in_pod")
        .eq("pod_id", input.podId)
        .eq("member_id", input.memberId)
        .maybeSingle(),
      admin
        .from("members")
        .select("status, claimed_at")
        .eq("id", input.memberId)
        .maybeSingle(),
    ]);
    if (!membership)
      return { error: "That person is not a member of this pod." };
    if (!member || member.status !== "active" || !member.claimed_at) {
      return { error: "Only active, activated members can lead a pod." };
    }
    if (membership.role_in_pod === input.slot) return { ok: true };
  }

  // Free the slot: its current holder becomes a member again.
  const { error: clearError } = await admin
    .from("pod_memberships")
    .update({ role_in_pod: "member" })
    .eq("pod_id", input.podId)
    .eq("role_in_pod", input.slot);
  if (clearError)
    return { error: "Couldn't update the pod. Please try again." };

  if (input.memberId) {
    const { error } = await admin
      .from("pod_memberships")
      .update({ role_in_pod: input.slot })
      .eq("pod_id", input.podId)
      .eq("member_id", input.memberId);
    if (error) return { error: "Couldn't update the pod. Please try again." };
  }

  if (me) {
    await auditTracker({
      actorId: me.id,
      action: input.memberId ? "pod_leader_set" : "pod_leader_cleared",
      targetType: "pod",
      targetId: input.podId,
      reason,
      metadata: { slot: input.slot, member_id: input.memberId },
    });
    if (input.memberId) {
      await notifyPresales({
        recipients: [input.memberId],
        actorId: me.id,
        event: "pod_leader_assigned",
      });
    }
  }

  revalidatePath(`/admin/pods/${pod.slug}`);
  revalidatePath("/admin/pods");
  return { ok: true };
}
