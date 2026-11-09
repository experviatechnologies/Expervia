"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import {
  sendMentorshipEmail,
  memberName,
  MENTOR_REASON,
  MENTEE_REASON,
} from "@/lib/eten/mentorship-email";

type ActionResult = { ok: true } | { error: string };

/**
 * A validated mentee requests 1:1 mentorship from a verified mentor. Writes with
 * service_role after checking the caller is validated and the target is a
 * verified mentor. One open request per pair is enforced by the DB index; we
 * check first to give a friendly message.
 */
export async function requestMentorship(input: {
  mentorId: string;
  message?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (input.mentorId === me.id) {
    return { error: "You can't request mentorship from yourself." };
  }

  const admin = getSupabaseAdmin();

  const { data: meRow } = await admin
    .from("members")
    .select("validated_at")
    .eq("id", me.id)
    .maybeSingle();
  if (!meRow?.validated_at) {
    return { error: "Validate your account before requesting a mentor." };
  }

  const { data: mentor } = await admin
    .from("mentor_profiles")
    .select("mentor_status, capability_area_id")
    .eq("member_id", input.mentorId)
    .maybeSingle();
  // A mentor_profiles row exists only for approved mentors (verified and up).
  if (!mentor || mentor.mentor_status === "candidate") {
    return { error: "That mentor isn't available." };
  }

  const { data: existing } = await admin
    .from("mentorship_requests")
    .select("id")
    .eq("mentee_id", me.id)
    .eq("mentor_id", input.mentorId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return { error: "You already have a pending request to this mentor." };
  }

  const message = (input.message ?? "").trim().slice(0, 500) || null;

  const { data: created, error } = await admin
    .from("mentorship_requests")
    .insert({
      mentee_id: me.id,
      mentor_id: input.mentorId,
      capability_area_id: mentor.capability_area_id ?? null,
      message,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { error: "Couldn't send your request. Please try again." };
  }

  await notify({
    recipientId: input.mentorId,
    actorId: me.id,
    type: "mentorship",
    targetType: "request_received",
    targetId: null,
  });
  const menteeName = await memberName(admin, me.id, "A mentee");
  await sendMentorshipEmail(input.mentorId, {
    subject: `${menteeName} would like you as a mentor`,
    preview: message
      ? `"${message.length > 80 ? `${message.slice(0, 80)}...` : message}"`
      : "Accept or decline from your mentor dashboard.",
    paragraphs: [
      `${menteeName} sent you a mentorship request on ETEN Mentorship.`,
    ],
    details: [
      { label: "From", value: menteeName },
      ...(message ? [{ label: "Their message", value: message }] : []),
    ],
    cta: { label: "Review request", path: "/mentor" },
    smallPrint: [
      "If you can't take them on right now, declining lets them find another mentor sooner.",
    ],
    reason: MENTOR_REASON,
  });

  revalidatePath("/mentorship/mentors");
  revalidatePath("/mentorship/dashboard");
  revalidatePath("/mentorship/mentor");
  return { ok: true };
}

/** The addressed mentor (or ops) accepts or declines a pending request. */
export async function decideMentorshipRequest(input: {
  requestId: string;
  decision: "accepted" | "declined";
  note?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (input.decision !== "accepted" && input.decision !== "declined") {
    return { error: "Invalid decision." };
  }

  const admin = getSupabaseAdmin();
  const { data: req } = await admin
    .from("mentorship_requests")
    .select("id, mentee_id, mentor_id, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!req) return { error: "Request not found." };
  if (req.status !== "pending") {
    return { error: "This request has already been decided." };
  }
  if (req.mentor_id !== me.id && !(await isOperations())) {
    return { error: "Only the mentor can decide this request." };
  }

  const { error } = await admin
    .from("mentorship_requests")
    .update({
      status: input.decision,
      decision_note: (input.note ?? "").trim().slice(0, 500) || null,
      decided_by: me.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending");
  if (error) return { error: "Couldn't save your decision. Please try again." };

  await notify({
    recipientId: req.mentee_id,
    actorId: me.id,
    type: "mentorship",
    targetType:
      input.decision === "accepted" ? "request_accepted" : "request_declined",
    targetId: null,
  });
  const mentorName = await memberName(admin, req.mentor_id, "Your mentor");
  const note = (input.note ?? "").trim().slice(0, 500);
  const noteDetails = note ? [{ label: "Their note", value: note }] : [];
  if (input.decision === "accepted") {
    await sendMentorshipEmail(req.mentee_id, {
      subject: `${mentorName} accepted your mentorship request`,
      preview: "Open your dashboard to see your next steps.",
      paragraphs: [
        `Good news: ${mentorName} has agreed to be your mentor on ETEN Mentorship.`,
        "Your dashboard shows what happens next, including sessions you can book.",
      ],
      details: noteDetails,
      cta: { label: "Go to my dashboard", path: "/dashboard" },
      reason: MENTEE_REASON,
    });
  } else {
    await sendMentorshipEmail(req.mentee_id, {
      subject: "An update on your mentorship request",
      preview: "There are other mentors ready to help.",
      paragraphs: [
        `${mentorName} isn't able to take on your mentorship request right now. This usually comes down to timing and capacity.`,
        "There are other mentors on ETEN Mentorship who can help with your goals.",
      ],
      details: noteDetails,
      cta: { label: "Find another mentor", path: "/mentors" },
      reason: MENTEE_REASON,
    });
  }

  revalidatePath("/mentorship/mentor");
  revalidatePath("/mentorship/dashboard");
  return { ok: true };
}

/** A mentee withdraws their own pending request. */
export async function withdrawMentorshipRequest(input: {
  requestId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("mentorship_requests")
    .update({ status: "withdrawn", decided_at: new Date().toISOString() })
    .eq("id", input.requestId)
    .eq("mentee_id", me.id)
    .eq("status", "pending");
  if (error) return { error: "Couldn't withdraw the request." };

  revalidatePath("/mentorship/dashboard");
  revalidatePath("/mentorship/mentors");
  return { ok: true };
}
