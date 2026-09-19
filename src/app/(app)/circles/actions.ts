"use server";

import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";

type CreateResult = { circleId: string } | { error: string };

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
