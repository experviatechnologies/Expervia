import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";

/**
 * Turning a pending session_booking into a real Circle session, shared by the
 * free mentor-accept flow (booking-actions.decideSessionBooking) and the paid
 * flow (a verified Paystack payment). Kept in a plain module, not a "use server"
 * file, so the payment webhook/return path can call it too.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;

function fmtWhenUtc(ms: number): string {
  return (
    new Date(ms).toLocaleString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

/**
 * Does [start,end) for the mentor collide with an already-scheduled session or
 * another accepted booking, expanded by the mentor's buffer? Final server-side
 * conflict guard (PRD FR-8); the UI is never trusted.
 */
export async function hasConflict(
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

export type ConfirmResult = { ok: true; circleId: string } | { error: string };

/**
 * Materialize a pending booking into a one_to_one Circle session: final
 * conflict check, create/reuse the mentee's 1:1 Circle, enrol them, create the
 * session + attendance row, link both ids back on the booking, and notify the
 * mentee (and optionally the mentor, for paid bookings). Idempotent: an
 * already-accepted booking returns its existing circle without duplicating.
 */
export async function confirmBookingToSession(
  admin: Admin,
  bookingId: string,
  opts: {
    createdBy: string | null;
    note: string | null;
    notifyMentor?: boolean;
  },
): Promise<ConfirmResult> {
  const { data: booking } = await admin
    .from("session_bookings")
    .select(
      "id, mentor_id, mentee_id, starts_at, duration_minutes, session_type, status, circle_id",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };

  // Idempotency: already confirmed -> hand back the existing circle.
  if (booking.status === "accepted" && booking.circle_id) {
    return { ok: true, circleId: booking.circle_id };
  }
  if (booking.status !== "pending") {
    return { error: "This booking can no longer be confirmed." };
  }

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
    return { error: "The mentor isn't verified." };
  }
  if (!mp.capability_area_id) {
    return { error: "The mentor hasn't set a capability area yet." };
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
        created_by: opts.createdBy,
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

  if (!circleId) {
    return { error: "Couldn't set up the session. Please try again." };
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
      decision_note: opts.note,
      decided_by: opts.createdBy,
      decided_at: new Date().toISOString(),
    })
    .eq("id", booking.id)
    .eq("status", "pending");
  if (updErr)
    return { error: "Couldn't confirm the booking. Please try again." };

  const whenUtc = fmtWhenUtc(startMs);

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
    `Your session for ${whenUtc} is confirmed. The live room opens 10 minutes before it starts; join it from your Circle.`,
  );

  if (opts.notifyMentor) {
    await notify({
      recipientId: booking.mentor_id,
      actorId: booking.mentee_id,
      type: "mentorship",
      targetType: "booking_paid",
      targetId: booking.id,
    });
    await sendMentorshipEmail(
      booking.mentor_id,
      "New paid session booked",
      "You have a new paid session",
      `A mentee booked and paid for a session with you for ${whenUtc}. It's confirmed and on your schedule.`,
    );
  }

  return { ok: true, circleId };
}
