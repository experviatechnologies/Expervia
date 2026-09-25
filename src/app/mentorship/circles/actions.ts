"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";

type Admin = ReturnType<typeof getSupabaseAdmin>;
type ActionResult = { ok: true } | { error: string };

function isDate(v: string | null): boolean {
  if (v === null) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

/** The caller's verified-mentor capability area, or null if not a verified mentor. */
async function verifiedMentorArea(
  admin: Admin,
  memberId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("mentor_profiles")
    .select("mentor_status, capability_area_id")
    .eq("member_id", memberId)
    .maybeSingle();
  if (!data || data.mentor_status !== "verified") return null;
  return data.capability_area_id ?? null;
}

/** True if the caller is the Circle's mentor or an operations member. */
async function mentorOrOps(
  admin: Admin,
  circleId: string,
  memberId: string,
): Promise<boolean> {
  if (await isOperations()) return true;
  const { data } = await admin
    .from("mentorship_circles")
    .select("mentor_id")
    .eq("id", circleId)
    .maybeSingle();
  return data?.mentor_id === memberId;
}

/**
 * A verified mentor creates a Circle in their capability area (pod-free). Starts
 * as a draft; the mentor then enrols mentees and activates it.
 */
export async function createCircle(input: {
  title?: string;
  cadence?: "weekly" | "biweekly";
  startDate?: string;
  endDate?: string;
}): Promise<{ ok: true; circleId: string } | { error: string }> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };

  const admin = getSupabaseAdmin();
  const areaId = await verifiedMentorArea(admin, me.id);
  if (!areaId) {
    return {
      error: "Only verified mentors with a capability area can create Circles.",
    };
  }

  const cadence = input.cadence === "biweekly" ? "biweekly" : "weekly";
  const startDate = input.startDate?.trim() || null;
  const endDate = input.endDate?.trim() || null;
  if (!isDate(startDate) || !isDate(endDate)) {
    return { error: "Please enter valid dates." };
  }

  const { data: circle, error } = await admin
    .from("mentorship_circles")
    .insert({
      mentor_id: me.id,
      capability_area_id: areaId,
      pod_id: null,
      title: input.title?.trim() || null,
      cadence,
      start_date: startDate,
      end_date: endDate,
      status: "draft",
      created_by: me.id,
    })
    .select("id")
    .single();
  if (error || !circle) {
    return { error: "Couldn't create the Circle. Please try again." };
  }

  revalidatePath("/mentorship/mentor");
  return { ok: true, circleId: circle.id };
}

/**
 * Enrol a mentee into a Circle by email. Mentor/ops only. The invitee must be
 * an active, ETEN-Validated member (Prospects can't join live Circles).
 */
export async function enrolMentee(input: {
  circleId: string;
  email: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  if (!(await mentorOrOps(admin, input.circleId, me.id))) {
    return { error: "Only this Circle's mentor can add mentees." };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Enter an email address." };

  // Resolve the email to an auth user (single page; fine for the current scale).
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authUser = list?.users.find(
    (u) => (u.email ?? "").toLowerCase() === email,
  );
  if (!authUser) {
    return { error: "No account with that email. Ask them to register first." };
  }

  const { data: member } = await admin
    .from("members")
    .select("id, status, validated_at")
    .eq("id", authUser.id)
    .maybeSingle();
  if (!member || member.status !== "active") {
    return { error: "That account isn't active." };
  }
  if (!member.validated_at) {
    return {
      error:
        "That member is still a Prospect. They must complete ETEN validation before joining a live Circle.",
    };
  }
  if (member.id === me.id) {
    return { error: "You can't enrol yourself as a mentee." };
  }

  const { count } = await admin
    .from("circle_memberships")
    .select("*", { count: "exact", head: true })
    .eq("circle_id", input.circleId);
  if ((count ?? 0) >= 10) {
    return { error: "A Circle can have at most 10 mentees." };
  }

  const { error } = await admin
    .from("circle_memberships")
    .insert({
      circle_id: input.circleId,
      member_id: member.id,
      status: "active",
    });
  if (error) {
    if (error.code === "23505") {
      return { error: "That member is already in this Circle." };
    }
    return { error: "Couldn't add the mentee. Please try again." };
  }

  await notify({
    recipientId: member.id,
    actorId: me.id,
    type: "mentorship",
    targetType: "circle",
    targetId: input.circleId,
  });

  revalidatePath(`/mentorship/circles/${input.circleId}`);
  return { ok: true };
}

/** A mentee sets their goal (target V-level + capability) for a Circle. */
export async function setCircleGoal(input: {
  circleId: string;
  targetVLevel: number;
  targetCapability: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const vl = Number(input.targetVLevel);
  if (!Number.isInteger(vl) || vl < 0 || vl > 5) {
    return { error: "Choose a target level." };
  }
  const capability = input.targetCapability?.trim() || null;

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

  revalidatePath(`/mentorship/circles/${input.circleId}`);
  return { ok: true };
}

/** Mentor/ops activate a draft Circle (needs at least one mentee). */
export async function activateCircle(input: {
  circleId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  if (!(await mentorOrOps(admin, input.circleId, me.id))) {
    return { error: "Only this Circle's mentor can activate it." };
  }

  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("status")
    .eq("id", input.circleId)
    .maybeSingle();
  if (!circle) return { error: "That Circle no longer exists." };
  if (circle.status !== "draft") {
    return { error: "This Circle is already active." };
  }

  const { count } = await admin
    .from("circle_memberships")
    .select("*", { count: "exact", head: true })
    .eq("circle_id", input.circleId);
  if ((count ?? 0) < 1) {
    return { error: "Add at least one mentee before activating." };
  }

  const { error } = await admin
    .from("mentorship_circles")
    .update({ status: "active" })
    .eq("id", input.circleId);
  if (error)
    return { error: "Couldn't activate the Circle. Please try again." };

  const { data: members } = await admin
    .from("circle_memberships")
    .select("member_id")
    .eq("circle_id", input.circleId);
  for (const m of members ?? []) {
    await notify({
      recipientId: m.member_id,
      actorId: me.id,
      type: "mentorship",
      targetType: "circle",
      targetId: input.circleId,
    });
  }

  revalidatePath(`/mentorship/circles/${input.circleId}`);
  return { ok: true };
}
