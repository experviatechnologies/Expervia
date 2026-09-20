"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";
import { addEvidenceRecord } from "@/lib/eten/evidence";
import { recordRecognition } from "@/lib/eten/recognition";
import { SCORE_CREDITS } from "@/lib/eten/recognition-types";

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

// ----------------------------------------------------------------------------
// M3 — running a Circle. Shared authz: mentor / pod-lead / ops may manage.
// ----------------------------------------------------------------------------
type CircleRow = {
  id: string;
  pod_id: string;
  mentor_id: string;
  status: "draft" | "active" | "completed";
};

async function canManageCircle(
  admin: ReturnType<typeof getSupabaseAdmin>,
  circleId: string,
  me: { id: string; role: string },
): Promise<{ circle: CircleRow } | { error: string }> {
  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("id, pod_id, mentor_id, status")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) return { error: "That Circle no longer exists." };

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
  if (!allowed) return { error: "You can't manage this Circle." };
  return { circle: circle as CircleRow };
}

/**
 * Log a session for an active Circle (M3.2). Mentor / lead / ops only. Creates
 * an attendance row (unmarked) for each active mentee so attendance can be
 * toggled.
 */
export async function addSession(input: {
  circleId: string;
  sessionDate?: string;
  title?: string;
  notes?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const mgr = await canManageCircle(admin, input.circleId, me);
  if ("error" in mgr) return mgr;
  if (mgr.circle.status !== "active") {
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
      notes: input.notes?.trim() || null,
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

  revalidatePath(`/circles/${input.circleId}`);
  return { ok: true };
}

/** Mark a mentee present/absent for a session (M3.2). Mentor / lead / ops. */
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

  const mgr = await canManageCircle(admin, session.circle_id, me);
  if ("error" in mgr) return mgr;

  const { error } = await admin.from("session_attendance").upsert(
    {
      session_id: input.sessionId,
      member_id: input.memberId,
      attended: input.attended,
    },
    { onConflict: "session_id,member_id" },
  );
  if (error) return { error: "Couldn't update attendance. Please try again." };

  revalidatePath(`/circles/${session.circle_id}`);
  return { ok: true };
}

/**
 * Post an assignment to a Circle (M3.3). Mentor / lead / ops, active Circle.
 */
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
  const mgr = await canManageCircle(admin, input.circleId, me);
  if ("error" in mgr) return mgr;
  if (mgr.circle.status !== "active") {
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

  revalidatePath(`/circles/${input.circleId}`);
  return { ok: true };
}

/**
 * A mentee submits (or resubmits) evidence for an assignment (M3.3). Written
 * via service_role after confirming the caller is an enrolled mentee of the
 * assignment's Circle. Resubmitting resets the row to 'submitted'.
 */
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

  revalidatePath(`/circles/${assignment.circle_id}`);
  return { ok: true };
}

/**
 * Mentor / lead / ops reviews an evidence submission (M3.4). Approve flips it
 * to 'approved', stamps the reviewer, and writes a capability-passport record
 * for the mentee (using their Circle goal, attributed to the mentor).
 * "needs_revision" records a note the mentee sees. Idempotent: the passport
 * record is only written on the transition INTO approved.
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

  const mgr = await canManageCircle(admin, assignment.circle_id, me);
  if ("error" in mgr) return mgr;

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
    const { data: goal } = await admin
      .from("circle_memberships")
      .select("target_v_level, target_capability")
      .eq("circle_id", assignment.circle_id)
      .eq("member_id", submission.member_id)
      .maybeSingle();
    await addEvidenceRecord({
      memberId: submission.member_id,
      title: assignment.title,
      category: "mentorship",
      capabilityArea: goal?.target_capability ?? null,
      vLevel: goal?.target_v_level ?? null,
      sourceType: "circle_assignment",
      sourceRef: submission.id,
      attributedTo: mgr.circle.mentor_id,
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

  revalidatePath(`/circles/${assignment.circle_id}`);
  return { ok: true };
}

/** A mentee "completes" a Circle if they have ≥1 approved assignment and
 *  attended at least this fraction of logged sessions (waived if none). */
const COMPLETION_MIN_ATTENDANCE = 0.5;

/**
 * Complete a Circle (M4). Mentor / lead / ops, from 'active'. Evaluates each
 * active mentee against the completion threshold; those who meet it are marked
 * completed and awarded an Expert Score credit + the circle_graduate badge.
 * The mentor is recognised (circle_mentor badge + score credit). Idempotent —
 * only fires on active → completed.
 */
export async function completeCircle(input: {
  circleId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const mgr = await canManageCircle(admin, input.circleId, me);
  if ("error" in mgr) return mgr;
  if (mgr.circle.status !== "active") {
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
    const completed = approved >= 1 && attendanceOk;
    if (!completed) continue;

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
  }

  // Recognise the mentor.
  await recordRecognition({
    memberId: mgr.circle.mentor_id,
    kind: "badge",
    badgeKey: "circle_mentor",
    label: "Ran a Mentorship Circle to completion",
    sourceType: "circle",
    sourceRef: input.circleId,
    awardedBy: me.id,
  });
  await recordRecognition({
    memberId: mgr.circle.mentor_id,
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
  if (error)
    return { error: "Couldn't complete the Circle. Please try again." };

  await writeAudit({
    actorId: me.id,
    action: "circle.completed",
    targetType: "circle",
    targetId: input.circleId,
  });

  revalidatePath(`/circles/${input.circleId}`);
  return { ok: true };
}
