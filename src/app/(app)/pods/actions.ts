"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";

type ActionResult = { ok: true } | { error: string };
type PodRole = "member" | "lead" | "co_lead";

/**
 * Set a member's role within a pod (member / lead / co-lead). Ops-only —
 * pod_memberships_role_ops requires is_operations(). Leads gain moderation reach
 * over their pod's content via the existing leads_any_target_pod() RLS. Written
 * via service_role after the ops check, and audited.
 */
export async function setPodRole(input: {
  podId: string;
  memberId: string;
  role: PodRole;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to set pod roles." };
  }
  if (!["member", "lead", "co_lead"].includes(input.role)) {
    return { error: "Unknown role." };
  }

  const me = await getCurrentMember();
  const { error } = await getSupabaseAdmin()
    .from("pod_memberships")
    .update({ role_in_pod: input.role })
    .eq("pod_id", input.podId)
    .eq("member_id", input.memberId);

  if (error) return { error: "Couldn't update the role. Please try again." };

  await writeAudit({
    actorId: me?.id ?? null,
    action: `pod.role.${input.role}`,
    targetType: "member",
    targetId: input.memberId,
    metadata: { podId: input.podId },
  });

  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}

/**
 * Join a pod as an ordinary member. Writes through the member's OWN session
 * client so RLS enforces it: pod_memberships_join_self only permits an insert
 * where member_id = auth.uid() and role_in_pod = 'member' (no self-appointing to
 * lead). The unique (pod_id, member_id) constraint makes a double-join a no-op.
 */
export async function joinPod(input: { podId: string }): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pod_memberships").insert({
    pod_id: input.podId,
    member_id: member.id,
    role_in_pod: "member",
  });

  // 23505 = already a member; treat as success (idempotent join).
  if (error && error.code !== "23505") {
    return { error: "Couldn't join the pod. Please try again." };
  }

  revalidatePath("/pods");
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}

/**
 * Leave a pod. RLS pod_memberships_leave allows deleting your own row. The
 * member's PRIMARY specialization pod can't be left here — that membership is
 * tied to their profile identity and onboarding; changing it belongs on the
 * profile editor, not a casual "leave".
 */
export async function leavePod(input: {
  podId: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_specialization_pod_id")
    .eq("member_id", member.id)
    .maybeSingle();

  if (profile?.primary_specialization_pod_id === input.podId) {
    return {
      error:
        "This is your primary specialization pod. Change it from your profile first.",
    };
  }

  const { error } = await supabase
    .from("pod_memberships")
    .delete()
    .eq("pod_id", input.podId)
    .eq("member_id", member.id);

  if (error) {
    return { error: "Couldn't leave the pod. Please try again." };
  }

  revalidatePath("/pods");
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}
