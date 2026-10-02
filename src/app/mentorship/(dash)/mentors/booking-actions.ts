"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";
import { getMentorSlots } from "@/lib/eten/availability";

type ActionResult = { ok: true } | { error: string };
type Admin = ReturnType<typeof getSupabaseAdmin>;

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

/**
 * Does [start,end) for the mentor collide with an already-scheduled session or
 * another accepted booking, expanded by the mentor's buffer? This is the final
 * server-side conflict guard (PRD FR-8); the UI is never trusted.
 */
async function hasConflict(
  admin: Admin,
  mentorId: string,
  startMs: number,
  endMs: number,
  bufferMin: number,
  ignoreBookingId: string,
): Promise<boolean> {
  const buffer = bufferMin * 60_000;
  const winFrom = new Date(startMs - 6 * 60 * 60_000).toISOString();
  const winTo = new Date(endMs + 6 * 60 * 60_000).toISOString();

  const [{ data: sessions }, { data: bookings }] = await Promise.all([
    admin
      .from("circle_sessions")
      .select(
        "starts_at, duration_minutes, mentorship_circles!inner(mentor_id)",
      )
      .eq("mentorship_circles.mentor_id", mentorId)
      .not("starts_at", "is", null)
      .gte("starts_at", winFrom)
      .lte("starts_at", winTo),
    admin
      .from("session_bookings")
      .select("id, starts_at, duration_minutes")
      .eq("mentor_id", mentorId)
      .eq("status", "accepted")
      .gte("starts_at", winFrom)
      .lte("starts_at", winTo),
  ]);

  const overlaps = (s: number, durMin: number | null) => {
    const bs = s - buffer;
    const be = s + (durMin ?? 40) * 60_000 + buffer;
    return startMs < be && endMs > bs;
  };

  for (const r of sessions ?? []) {
    if (overlaps(Date.parse(String(r.starts_at)), r.duration_minutes))
      return true;
  }
  for (const b of bookings ?? []) {
    if (b.id === ignoreBookingId) continue;
    if (overlaps(Date.parse(String(b.starts_at)), b.duration_minutes))
      return true;
  }
  return false;
}

/**
 * The addressed mentor (or ops) accepts or declines a pending booking. On
 * accept, after a final conflict check, the booking becomes a session inside a
 * one_to_one Circle (created or reused) and both ids are linked back. The mentee
 * is notified either way.
 */
export async function decideSessionBooking(input: {
  bookingId: string;
  decision: "accepted" | "declined";
  note?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (input.decision !== "accepted" && input.decision !== "declined") {
    return { error: "Invalid decision." };
  }

  const admin = getSupabaseAdmin();
  const { data: booking } = await admin
    .from("session_bookings")
    .select(
      "id, mentor_id, mentee_id, starts_at, duration_minutes, session_type, status",
    )
    .eq("id", input.bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "pending") {
    return { error: "This booking has already been decided." };
  }
  const ops = await isOperations();
  if (booking.mentor_id !== me.id && !ops) {
    return { error: "Only the mentor can decide this booking." };
  }

  const note = (input.note ?? "").trim().slice(0, 500) || null;
  const nowIso = new Date().toISOString();

  if (input.decision === "declined") {
    const { error } = await admin
      .from("session_bookings")
      .update({
        status: "declined",
        decision_note: note,
        decided_by: me.id,
        decided_at: nowIso,
      })
      .eq("id", booking.id)
      .eq("status", "pending");
    if (error) return { error: "Couldn't save your decision. Try again." };

    await notify({
      recipientId: booking.mentee_id,
      actorId: booking.mentor_id,
      type: "mentorship",
      targetType: "booking_declined",
      targetId: null,
    });
    revalidatePath("/mentorship/mentor");
    revalidatePath(`/mentorship/mentors/${booking.mentor_id}`);
    return { ok: true };
  }

  // --- Accept ---
  const startMs = Date.parse(booking.starts_at);
  const endMs = startMs + booking.duration_minutes * 60_000;

  const { data: prefs } = await admin
    .from("mentor_scheduling_prefs")
    .select("buffer_minutes")
    .eq("member_id", booking.mentor_id)
    .maybeSingle();

  if (
    await hasConflict(
      admin,
      booking.mentor_id,
      startMs,
      endMs,
      prefs?.buffer_minutes ?? 0,
      booking.id,
    )
  ) {
    return {
      error: "That time now conflicts with another session. Ask for another.",
    };
  }

  // A one_to_one Circle must have a capability-area home (pod_id is null).
  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status, capability_area_id")
    .eq("member_id", booking.mentor_id)
    .maybeSingle();
  if (!mp || mp.mentor_status === "candidate") {
    return { error: "You aren't a verified mentor." };
  }
  if (!mp.capability_area_id) {
    return {
      error: "Set your capability area in your profile before accepting.",
    };
  }

  // Reuse an existing active 1:1 Circle with this mentee, else create one.
  let circleId: string | null = null;
  const { data: oneToOnes } = await admin
    .from("mentorship_circles")
    .select("id")
    .eq("mentor_id", booking.mentor_id)
    .eq("format", "one_to_one")
    .in("status", ["draft", "active"]);
  const oneToOneIds = (oneToOnes ?? []).map((c) => c.id);
  if (oneToOneIds.length) {
    const { data: membership } = await admin
      .from("circle_memberships")
      .select("circle_id")
      .eq("member_id", booking.mentee_id)
      .eq("status", "active")
      .in("circle_id", oneToOneIds)
      .limit(1)
      .maybeSingle();
    circleId = membership?.circle_id ?? null;
  }

  if (!circleId) {
    const { data: circle, error: circleErr } = await admin
      .from("mentorship_circles")
      .insert({
        mentor_id: booking.mentor_id,
        capability_area_id: mp.capability_area_id,
        pod_id: null,
        format: "one_to_one",
        cadence: "weekly",
        status: "active",
        created_by: me.id,
      })
      .select("id")
      .single();
    if (circleErr || !circle) {
      return { error: "Couldn't set up the session. Please try again." };
    }
    circleId = circle.id;

    const { error: enrolErr } = await admin.from("circle_memberships").insert({
      circle_id: circleId,
      member_id: booking.mentee_id,
      status: "active",
    });
    if (enrolErr && enrolErr.code !== "23505") {
      return { error: "Couldn't enrol the mentee. Please try again." };
    }
  }

  const startIso = new Date(startMs).toISOString();
  const { data: session, error: sessErr } = await admin
    .from("circle_sessions")
    .insert({
      circle_id: circleId,
      title: "1:1 session",
      starts_at: startIso,
      duration_minutes: booking.duration_minutes,
      session_type: booking.session_type,
      session_date: startIso.slice(0, 10),
    })
    .select("id")
    .single();
  if (sessErr || !session) {
    return { error: "Couldn't schedule the session. Please try again." };
  }

  await admin.from("session_attendance").insert({
    session_id: session.id,
    member_id: booking.mentee_id,
    attended: false,
  });

  const { error: updErr } = await admin
    .from("session_bookings")
    .update({
      status: "accepted",
      circle_id: circleId,
      session_id: session.id,
      decision_note: note,
      decided_by: me.id,
      decided_at: nowIso,
    })
    .eq("id", booking.id)
    .eq("status", "pending");
  if (updErr)
    return { error: "Couldn't confirm the booking. Please try again." };

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
    recipientId: booking.mentee_id,
    actorId: booking.mentor_id,
    type: "mentorship",
    targetType: "booking_accepted",
    targetId: circleId,
  });
  await sendMentorshipEmail(
    booking.mentee_id,
    "Your session is confirmed",
    "Your session is confirmed",
    `Your mentor confirmed your session for ${whenUtc}. The live room opens 10 minutes before it starts; join it from your Circle.`,
  );

  revalidatePath("/mentorship/mentor");
  revalidatePath(`/mentorship/mentors/${booking.mentor_id}`);
  revalidatePath(`/mentorship/circles/${circleId}`);
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
