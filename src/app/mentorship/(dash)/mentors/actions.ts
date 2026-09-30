"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";

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
  await sendMentorshipEmail(
    input.mentorId,
    "New mentorship request",
    "You have a new mentorship request",
    "A mentee has requested you as a mentor on ETEN Mentorship. Open your dashboard to accept or decline.",
  );

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
  if (input.decision === "accepted") {
    await sendMentorshipEmail(
      req.mentee_id,
      "Your mentorship request was accepted",
      "Good news, your request was accepted",
      "A mentor accepted your mentorship request on ETEN Mentorship. Open your dashboard to see what's next.",
    );
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
