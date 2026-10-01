"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";
import { getMentorSlots } from "@/lib/eten/availability";

type ActionResult = { ok: true } | { error: string };

/**
 * A validated mentee requests a specific availability slot with a mentor. The
 * slot is re-validated server-side against freshly generated availability (the
 * UI is never trusted, PRD FR-8), then a pending session_booking is created and
 * the mentor is notified. Accept/decline and turning this into a Circle session
 * happen in AV-5.
 */
export async function requestSessionBooking(input: {
  mentorId: string;
  startsAt: string; // ISO UTC, one of the offered slot starts
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (input.mentorId === me.id) {
    return { error: "You can't book a session with yourself." };
  }

  const startMs = Date.parse(input.startsAt ?? "");
  if (Number.isNaN(startMs)) return { error: "Please pick a valid time." };

  const admin = getSupabaseAdmin();

  const { data: meRow } = await admin
    .from("members")
    .select("validated_at")
    .eq("id", me.id)
    .maybeSingle();
  if (!meRow?.validated_at) {
    return { error: "Validate your account before booking a session." };
  }

  const { data: mentor } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", input.mentorId)
    .maybeSingle();
  if (!mentor || mentor.mentor_status === "candidate") {
    return { error: "That mentor isn't available." };
  }

  // Re-generate slots and confirm the requested time is still on offer.
  const { slots, durationMinutes } = await getMentorSlots(input.mentorId, {
    days: 60,
  });
  const slot = slots.find((s) => Date.parse(s.start) === startMs);
  if (!slot) {
    return { error: "That time is no longer available. Please pick another." };
  }

  // Friendly pre-check; the partial unique index is the real guard.
  const { data: existing } = await admin
    .from("session_bookings")
    .select("id")
    .eq("mentee_id", me.id)
    .eq("mentor_id", input.mentorId)
    .eq("starts_at", new Date(startMs).toISOString())
    .in("status", ["pending", "accepted"])
    .maybeSingle();
  if (existing) {
    return { error: "You've already requested this time." };
  }

  const { data: created, error } = await admin
    .from("session_bookings")
    .insert({
      mentor_id: input.mentorId,
      mentee_id: me.id,
      starts_at: new Date(startMs).toISOString(),
      duration_minutes: slot.durationMinutes || durationMinutes,
      session_type: "standard",
    })
    .select("id")
    .single();
  if (error || !created) {
    if (error?.code === "23505") {
      return { error: "You've already requested this time." };
    }
    return { error: "Couldn't request that time. Please try again." };
  }

  const whenUtc =
    new Date(startMs).toLocaleString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC";

  await notify({
    recipientId: input.mentorId,
    actorId: me.id,
    type: "mentorship",
    targetType: "booking_requested",
    targetId: created.id,
  });
  await sendMentorshipEmail(
    input.mentorId,
    "New session booking request",
    "A mentee requested a session time",
    `A mentee asked to book a session with you for ${whenUtc}. Open your dashboard to accept or decline.`,
  );

  revalidatePath(`/mentorship/mentors/${input.mentorId}`);
  revalidatePath("/mentorship/mentor");
  return { ok: true };
}

/** A mentee cancels their own pending booking request. */
export async function cancelSessionBooking(input: {
  bookingId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const { data: booking, error } = await admin
    .from("session_bookings")
    .update({ status: "cancelled", decided_at: new Date().toISOString() })
    .eq("id", input.bookingId)
    .eq("mentee_id", me.id)
    .eq("status", "pending")
    .select("mentor_id")
    .maybeSingle();
  if (error) return { error: "Couldn't cancel that request." };

  if (booking) revalidatePath(`/mentorship/mentors/${booking.mentor_id}`);
  return { ok: true };
}
