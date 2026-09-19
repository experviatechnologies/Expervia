"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";

type CreateResult = { circleId: string } | { error: string };
type ActionResult = { ok: true } | { error: string };

const isDate = (d: string | null) =>
  d === null || /^\d{4}-\d{2}-\d{2}$/.test(d);

/**
 * Create a Mentorship Circle (M2.2). Pod-Leader action, gated in code and
 * written via service_role (these tables have no client write policy).
 * Enforces: caller leads the pod, the mentor is a Verified Mentor in the pod,
 * 1–10 mentees all drawn from that pod, no self-mentoring. Created as 'draft';
 * mentees set their goals and the lead activates it (M2.3).
 */
export async function createCircle(input: {
  podId: string;
  mentorId: string;
  menteeIds: string[];
  cadence: "weekly" | "biweekly";
  startDate?: string;
  endDate?: string;
  title?: string;
}): Promise<CreateResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };

  const admin = getSupabaseAdmin();

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
    return { error: "Only this pod's leads can create Circles." };
  }

  const { data: podMembers } = await admin
    .from("pod_memberships")
    .select("member_id")
    .eq("pod_id", input.podId);
  const memberSet = new Set((podMembers ?? []).map((m) => m.member_id));

  if (!memberSet.has(input.mentorId)) {
    return { error: "The mentor must be a member of this pod." };
  }
  const { data: mentorProfile } = await admin
    .from("mentor_profiles")
    .select("member_id")
    .eq("member_id", input.mentorId)
    .maybeSingle();
  if (!mentorProfile) {
    return { error: "Choose a Verified Mentor." };
  }

  const mentees = [...new Set(input.menteeIds ?? [])].filter(
    (id) => id && id !== input.mentorId,
  );
  if (mentees.length < 1) return { error: "Add at least one mentee." };
  if (mentees.length > 10) {
    return { error: "A Circle can have at most 10 mentees." };
  }
  if (!mentees.every((id) => memberSet.has(id))) {
    return { error: "All mentees must be members of this pod." };
  }

  const cadence = input.cadence === "biweekly" ? "biweekly" : "weekly";
  const startDate = input.startDate?.trim() || null;
  const endDate = input.endDate?.trim() || null;
  if (!isDate(startDate) || !isDate(endDate)) {
    return { error: "Please enter valid dates." };
  }

  const { data: circle, error: circleError } = await admin
    .from("mentorship_circles")
    .insert({
      pod_id: input.podId,
      mentor_id: input.mentorId,
      title: input.title?.trim() || null,
      cadence,
      start_date: startDate,
      end_date: endDate,
      status: "draft",
      created_by: me.id,
    })
    .select("id")
    .single();
  if (circleError || !circle) {
    return { error: "Couldn't create the Circle. Please try again." };
  }

  const { error: enrolError } = await admin.from("circle_memberships").insert(
    mentees.map((member_id) => ({
      circle_id: circle.id,
      member_id,
      status: "active" as const,
    })),
  );
  if (enrolError) {
    await admin.from("mentorship_circles").delete().eq("id", circle.id);
    return { error: "Couldn't enrol the mentees. Please try again." };
  }

  await writeAudit({
    actorId: me.id,
    action: "circle.created",
    targetType: "circle",
    targetId: circle.id,
    metadata: { podId: input.podId, mentees: mentees.length },
  });

  return { circleId: circle.id };
}

/**
 * A mentee sets/updates their goal (target V-level + capability) for a Circle
 * they're enrolled in (M2.3). Written via service_role after confirming the
 * caller is actually a member of that Circle.
 */
export async function setCircleGoal(input: {
  circleId: string;
  targetVLevel: number;
  targetCapability: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const vl = Math.trunc(Number(input.targetVLevel));
  if (!Number.isInteger(vl) || vl < 0 || vl > 5) {
    return { error: "Choose a target V-level." };
  }
  const capability = input.targetCapability?.trim();
  if (!capability) return { error: "Enter a capability area." };

  const admin = getSupabaseAdmin();
  const { data: membership } = await admin
    .from("circle_memberships")
    .select("id")
    .eq("circle_id", input.circleId)
    .eq("member_id", me.id)
    .maybeSingle();
  if (!membership) return { error: "You're not a member of this Circle." };

  const { error } = await admin
    .from("circle_memberships")
    .update({ target_v_level: vl, target_capability: capability })
    .eq("id", membership.id);
  if (error) return { error: "Couldn't save your goal. Please try again." };

  revalidatePath(`/circles/${input.circleId}`);
  return { ok: true };
}

/**
 * Activate a draft Circle (M2.3). The mentor, a lead of the Circle's pod, or
 * ops may activate — but only once every enrolled mentee has set a goal.
 */
export async function activateCircle(input: {
  circleId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("id, pod_id, mentor_id, status")
    .eq("id", input.circleId)
    .maybeSingle();
  if (!circle) return { error: "That Circle no longer exists." };
  if (circle.status !== "draft") {
    return { error: "This Circle isn't a draft." };
  }

  let allowed = me.role === "operations" || circle.mentor_id === me.id;
  if (!allowed) {
    const { data: lead } = await admin
      .from("pod_memberships")
      .select("role_in_pod")
      .eq("pod_id", circle.pod_id)
      .eq("member_id", me.id)
      .maybeSingle();
    allowed = lead?.role_in_pod === "lead" || lead?.role_in_pod === "co_lead";
  }
  if (!allowed) return { error: "You can't activate this Circle." };

  const { data: mems } = await admin
    .from("circle_memberships")
    .select("target_v_level, status")
    .eq("circle_id", input.circleId);
  const active = (mems ?? []).filter((m) => m.status === "active");
  if (active.length === 0) return { error: "Add at least one mentee first." };
  if (!active.every((m) => m.target_v_level != null)) {
    return { error: "Every mentee must set a goal before activating." };
  }

  const { error } = await admin
    .from("mentorship_circles")
    .update({ status: "active" })
    .eq("id", input.circleId);
  if (error) return { error: "Couldn't activate. Please try again." };

  await writeAudit({
    actorId: me.id,
    action: "circle.activated",
    targetType: "circle",
    targetId: input.circleId,
  });

  revalidatePath(`/circles/${input.circleId}`);
  return { ok: true };
}
