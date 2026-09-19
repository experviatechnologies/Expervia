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
 * Nominate a member of your pod as a Mentor Candidate (Mentorship M1.2).
 *
 * Pod-Leader action, gated in code and written via service_role (mentor_
 * nominations has no client write policy). Requires: the caller leads this pod
 * (lead/co_lead), the nominee is a V2+ member of the same pod, isn't already a
 * mentor, and has no open nomination. The Verification Desk (ops) decides next.
 */
export async function nominateMentor(input: {
  podId: string;
  memberId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (me.id === input.memberId) {
    return { error: "You can't nominate yourself." };
  }

  const admin = getSupabaseAdmin();

  // Caller must lead this pod.
  const { data: myMembership } = await admin
    .from("pod_memberships")
    .select("role_in_pod")
    .eq("pod_id", input.podId)
    .eq("member_id", me.id)
    .maybeSingle();
  if (
    !myMembership ||
    (myMembership.role_in_pod !== "lead" &&
      myMembership.role_in_pod !== "co_lead")
  ) {
    return { error: "Only this pod's leads can nominate mentors." };
  }

  // Nominee must be a member of the same pod.
  const { data: theirMembership } = await admin
    .from("pod_memberships")
    .select("member_id")
    .eq("pod_id", input.podId)
    .eq("member_id", input.memberId)
    .maybeSingle();
  if (!theirMembership) {
    return { error: "That member isn't in this pod." };
  }

  // Nominee must be V2+ and not already a mentor.
  const [{ data: nominee }, { data: existingMentor }] = await Promise.all([
    admin
      .from("members")
      .select("v_level")
      .eq("id", input.memberId)
      .maybeSingle(),
    admin
      .from("mentor_profiles")
      .select("member_id")
      .eq("member_id", input.memberId)
      .maybeSingle(),
  ]);
  if ((nominee?.v_level ?? 0) < 2) {
    return { error: "Only V2+ members can be nominated as mentors." };
  }
  if (existingMentor) {
    return { error: "That member is already a mentor." };
  }

  const { error } = await admin.from("mentor_nominations").insert({
    member_id: input.memberId,
    pod_id: input.podId,
    nominated_by: me.id,
    status: "pending",
  });
  // 23505 = the partial unique (one pending per member) — already nominated.
  if (error) {
    if (error.code === "23505") {
      return { error: "That member already has a pending nomination." };
    }
    return { error: "Couldn't submit the nomination. Please try again." };
  }

  await writeAudit({
    actorId: me.id,
    action: "mentor.nominated",
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
