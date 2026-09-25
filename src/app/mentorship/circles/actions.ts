"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { addEvidenceRecord } from "@/lib/eten/evidence";
import { writeAudit } from "@/lib/eten/audit";
import { recordRecognition } from "@/lib/eten/recognition";
import { SCORE_CREDITS } from "@/lib/eten/recognition-types";

const COMPLETION_MIN_ATTENDANCE = 0.5;

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

  const { error } = await admin.from("circle_memberships").insert({
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

/** Mentor/ops log a session on an active Circle (seeds attendance rows). */
export async function addSession(input: {
  circleId: string;
  title?: string;
  sessionDate?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  if (!(await mentorOrOps(admin, input.circleId, me.id))) {
    return { error: "Only this Circle's mentor can log sessions." };
  }

  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("status")
    .eq("id", input.circleId)
    .maybeSingle();
  if (!circle) return { error: "That Circle no longer exists." };
  if (circle.status !== "active") {
    return { error: "Sessions can be logged once the Circle is active." };
  }

  const sessionDate = input.sessionDate?.trim() || null;
  if (!isDate(sessionDate)) return { error: "Please enter a valid date." };

  const { data: session, error } = await admin
    .from("circle_sessions")
    .insert({
      circle_id: input.circleId,
      session_date: sessionDate,
      title: input.title?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !session) {
    return { error: "Couldn't add the session. Please try again." };
  }

  const { data: mentees } = await admin
    .from("circle_memberships")
    .select("member_id")
    .eq("circle_id", input.circleId)
    .eq("status", "active");
  if (mentees?.length) {
    await admin.from("session_attendance").insert(
      mentees.map((m) => ({
        session_id: session.id,
        member_id: m.member_id,
        attended: false,
      })),
    );
  }

  revalidatePath(`/mentorship/circles/${input.circleId}`);
  return { ok: true };
}

/** Mentor/ops mark a mentee present/absent for a session. */
export async function setAttendance(input: {
  sessionId: string;
  memberId: string;
  attended: boolean;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const { data: session } = await admin
    .from("circle_sessions")
    .select("circle_id")
    .eq("id", input.sessionId)
    .maybeSingle();
  if (!session) return { error: "That session no longer exists." };
  if (!(await mentorOrOps(admin, session.circle_id, me.id))) {
    return { error: "Only this Circle's mentor can mark attendance." };
  }

  const { error } = await admin.from("session_attendance").upsert(
    {
      session_id: input.sessionId,
      member_id: input.memberId,
      attended: input.attended,
    },
    { onConflict: "session_id,member_id" },
  );
  if (error) return { error: "Couldn't update attendance. Please try again." };

  revalidatePath(`/mentorship/circles/${session.circle_id}`);
  return { ok: true };
}

/** Mentor/ops post an assignment to an active Circle; notify mentees. */
export async function postAssignment(input: {
  circleId: string;
  title: string;
  instructions?: string;
  dueDate?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const title = input.title?.trim();
  if (!title) return { error: "A title is required." };
  if (title.length > 200) return { error: "That title is too long (200 max)." };

  const admin = getSupabaseAdmin();
  if (!(await mentorOrOps(admin, input.circleId, me.id))) {
    return { error: "Only this Circle's mentor can post assignments." };
  }
  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("status")
    .eq("id", input.circleId)
    .maybeSingle();
  if (!circle) return { error: "That Circle no longer exists." };
  if (circle.status !== "active") {
    return { error: "Assignments can be posted once the Circle is active." };
  }

  const dueDate = input.dueDate?.trim() || null;
  if (!isDate(dueDate)) return { error: "Please enter a valid due date." };

  const { error } = await admin.from("circle_assignments").insert({
    circle_id: input.circleId,
    title,
    instructions: input.instructions?.trim() || null,
    due_date: dueDate,
  });
  if (error)
    return { error: "Couldn't post the assignment. Please try again." };

  const { data: mentees } = await admin
    .from("circle_memberships")
    .select("member_id")
    .eq("circle_id", input.circleId)
    .eq("status", "active");
  for (const m of mentees ?? []) {
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

/** A mentee submits or resubmits evidence for an assignment. */
export async function submitEvidence(input: {
  assignmentId: string;
  content: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const content = input.content?.trim();
  if (!content) return { error: "Add your evidence (text or a link)." };

  const admin = getSupabaseAdmin();
  const { data: assignment } = await admin
    .from("circle_assignments")
    .select("id, circle_id")
    .eq("id", input.assignmentId)
    .maybeSingle();
  if (!assignment) return { error: "That assignment no longer exists." };

  const { data: membership } = await admin
    .from("circle_memberships")
    .select("id")
    .eq("circle_id", assignment.circle_id)
    .eq("member_id", me.id)
    .maybeSingle();
  if (!membership) return { error: "You're not a member of this Circle." };

  const { error } = await admin.from("evidence_submissions").upsert(
    {
      assignment_id: input.assignmentId,
      member_id: me.id,
      content,
      status: "submitted",
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
    },
    { onConflict: "assignment_id,member_id" },
  );
  if (error) return { error: "Couldn't submit. Please try again." };

  revalidatePath(`/mentorship/circles/${assignment.circle_id}`);
  return { ok: true };
}

/**
 * Mentor/ops review a submission. Approve flips it to 'approved' and writes a
 * capability-passport record for the mentee (their goal, attributed to the
 * mentor); "needs_revision" records a note. Passport write only on the
 * transition into approved.
 */
export async function reviewSubmission(input: {
  submissionId: string;
  decision: "approved" | "needs_revision";
  note?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (input.decision !== "approved" && input.decision !== "needs_revision") {
    return { error: "Invalid decision." };
  }

  const admin = getSupabaseAdmin();
  const { data: submission } = await admin
    .from("evidence_submissions")
    .select("id, assignment_id, member_id, status")
    .eq("id", input.submissionId)
    .maybeSingle();
  if (!submission) return { error: "That submission no longer exists." };

  const { data: assignment } = await admin
    .from("circle_assignments")
    .select("id, circle_id, title")
    .eq("id", submission.assignment_id)
    .maybeSingle();
  if (!assignment) return { error: "That assignment no longer exists." };

  if (!(await mentorOrOps(admin, assignment.circle_id, me.id))) {
    return { error: "Only this Circle's mentor can review evidence." };
  }

  const alreadyApproved = submission.status === "approved";

  const { error } = await admin
    .from("evidence_submissions")
    .update({
      status: input.decision,
      review_note:
        input.decision === "needs_revision" ? input.note?.trim() || null : null,
      reviewed_by: me.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);
  if (error) return { error: "Couldn't save the review. Please try again." };

  if (input.decision === "approved" && !alreadyApproved) {
    const [{ data: goal }, { data: circle }] = await Promise.all([
      admin
        .from("circle_memberships")
        .select("target_v_level, target_capability")
        .eq("circle_id", assignment.circle_id)
        .eq("member_id", submission.member_id)
        .maybeSingle(),
      admin
        .from("mentorship_circles")
        .select("mentor_id")
        .eq("id", assignment.circle_id)
        .maybeSingle(),
    ]);
    await addEvidenceRecord({
      memberId: submission.member_id,
      title: assignment.title,
      category: "mentorship",
      capabilityArea: goal?.target_capability ?? null,
      vLevel: goal?.target_v_level ?? null,
      sourceType: "circle_assignment",
      sourceRef: submission.id,
      attributedTo: circle?.mentor_id ?? null,
      issuedBy: me.id,
      occurredAt: new Date().toISOString().slice(0, 10),
    });
  }

  await writeAudit({
    actorId: me.id,
    action:
      input.decision === "approved"
        ? "circle.evidence_approved"
        : "circle.evidence_revision",
    targetType: "member",
    targetId: submission.member_id,
    metadata: { submissionId: submission.id },
  });

  await notify({
    recipientId: submission.member_id,
    actorId: me.id,
    type: "mentorship",
    targetType: "circle",
    targetId: assignment.circle_id,
  });

  revalidatePath(`/mentorship/circles/${assignment.circle_id}`);
  return { ok: true };
}

/**
 * Mentor/ops complete an active Circle. Each active mentee who has >=1 approved
 * assignment and >=50% attendance (waived if no sessions) graduates: membership
 * completed + Expert Score credit + Circle Graduate badge. The mentor is
 * recognised too. Idempotent on active -> completed.
 */
export async function completeCircle(input: {
  circleId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  if (!(await mentorOrOps(admin, input.circleId, me.id))) {
    return { error: "Only this Circle's mentor can complete it." };
  }

  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("mentor_id, status")
    .eq("id", input.circleId)
    .maybeSingle();
  if (!circle) return { error: "That Circle no longer exists." };
  if (circle.status !== "active") {
    return { error: "Only an active Circle can be completed." };
  }

  const [{ data: mentees }, { data: sessions }, { data: assignments }] =
    await Promise.all([
      admin
        .from("circle_memberships")
        .select("member_id")
        .eq("circle_id", input.circleId)
        .eq("status", "active"),
      admin
        .from("circle_sessions")
        .select("id")
        .eq("circle_id", input.circleId),
      admin
        .from("circle_assignments")
        .select("id")
        .eq("circle_id", input.circleId),
    ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const totalSessions = sessionIds.length;

  const [{ data: attendance }, { data: subs }] = await Promise.all([
    sessionIds.length
      ? admin
          .from("session_attendance")
          .select("member_id, attended")
          .in("session_id", sessionIds)
      : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? admin
          .from("evidence_submissions")
          .select("member_id, status")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const attendedBy = new Map<string, number>();
  for (const a of attendance ?? []) {
    if (a.attended)
      attendedBy.set(a.member_id, (attendedBy.get(a.member_id) ?? 0) + 1);
  }
  const approvedBy = new Map<string, number>();
  for (const s of subs ?? []) {
    if (s.status === "approved")
      approvedBy.set(s.member_id, (approvedBy.get(s.member_id) ?? 0) + 1);
  }

  for (const { member_id } of mentees ?? []) {
    const approved = approvedBy.get(member_id) ?? 0;
    const attendanceOk =
      totalSessions === 0 ||
      (attendedBy.get(member_id) ?? 0) / totalSessions >=
        COMPLETION_MIN_ATTENDANCE;
    if (approved < 1 || !attendanceOk) continue;

    await admin
      .from("circle_memberships")
      .update({ status: "completed" })
      .eq("circle_id", input.circleId)
      .eq("member_id", member_id);
    await recordRecognition({
      memberId: member_id,
      kind: "score_credit",
      points: SCORE_CREDITS.circle_completed_mentee,
      label: "Completed a Mentorship Circle",
      sourceType: "circle",
      sourceRef: input.circleId,
      awardedBy: me.id,
    });
    await recordRecognition({
      memberId: member_id,
      kind: "badge",
      badgeKey: "circle_graduate",
      label: "Circle Graduate",
      sourceType: "circle",
      sourceRef: input.circleId,
      awardedBy: me.id,
    });
    await notify({
      recipientId: member_id,
      actorId: me.id,
      type: "mentorship",
      targetType: "circle",
      targetId: input.circleId,
    });
  }

  await recordRecognition({
    memberId: circle.mentor_id,
    kind: "badge",
    badgeKey: "circle_mentor",
    label: "Ran a Mentorship Circle to completion",
    sourceType: "circle",
    sourceRef: input.circleId,
    awardedBy: me.id,
  });
  await recordRecognition({
    memberId: circle.mentor_id,
    kind: "score_credit",
    points: SCORE_CREDITS.circle_completed_mentor,
    label: "Ran a Mentorship Circle to completion",
    sourceType: "circle",
    sourceRef: input.circleId,
    awardedBy: me.id,
  });

  const { error } = await admin
    .from("mentorship_circles")
    .update({ status: "completed" })
    .eq("id", input.circleId);
  if (error) {
    return { error: "Couldn't complete the Circle. Please try again." };
  }

  await writeAudit({
    actorId: me.id,
    action: "circle.completed",
    targetType: "circle",
    targetId: input.circleId,
  });

  revalidatePath(`/mentorship/circles/${input.circleId}`);
  return { ok: true };
}
