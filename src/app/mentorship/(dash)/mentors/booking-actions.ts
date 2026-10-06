"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";
import { getMentorSlots } from "@/lib/eten/availability";
import { confirmBookingToSession } from "@/lib/eten/booking-confirm";
import { getMonetizationSettings, computeSplit } from "@/lib/eten/monetization";
import { paystackInitialize, isPaystackConfigured } from "@/lib/eten/paystack";
import { requestOrigin } from "@/lib/eten/request-origin";

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

  // --- Accept --- materialize the booking into a session (shared with the
  // paid-payment flow). The free flow records the mentor as the decider.
  const res = await confirmBookingToSession(admin, booking.id, {
    createdBy: me.id,
    note,
    notifyMentor: false,
  });
  if ("error" in res) return { error: res.error };

  revalidatePath("/mentorship/mentor");
  revalidatePath(`/mentorship/mentors/${booking.mentor_id}`);
  revalidatePath(`/mentorship/circles/${res.circleId}`);
  return { ok: true };
}

/**
 * Begin a PAID session booking (Monetization M-3). Validates the mentee, the
 * mentor's paid pricing and the slot, creates a pending booking + pending
 * payment, then initializes a Paystack transaction and returns the hosted
 * checkout URL for the client to redirect to. The booking is confirmed only
 * once the payment is verified (webhook or return page); nothing is scheduled
 * here, and no money is computed on the client.
 */
export async function startPaidBooking(input: {
  mentorId: string;
  startsAt: string;
}): Promise<{ ok: true; authorizationUrl: string } | { error: string }> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (input.mentorId === me.id) {
    return { error: "You can't book a session with yourself." };
  }
  if (!isPaystackConfigured()) {
    return { error: "Payments aren't available right now." };
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

  // Pricing: the mentor must have paid sessions on with a standard price.
  const { data: pricing } = await admin
    .from("mentor_pricing")
    .select("paid_sessions_enabled, currency, standard_amount")
    .eq("member_id", input.mentorId)
    .maybeSingle();
  if (!pricing?.paid_sessions_enabled || !pricing.standard_amount) {
    return { error: "This mentor isn't taking paid sessions." };
  }
  const amount = pricing.standard_amount;
  const currency = pricing.currency;

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
    return { error: "You've already booked this time." };
  }

  // Create the pending booking (held; confirmed only after payment).
  const { data: booking, error: bookErr } = await admin
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
  if (bookErr || !booking) {
    if (bookErr?.code === "23505") {
      return { error: "You've already booked this time." };
    }
    return { error: "Couldn't start that booking. Please try again." };
  }

  // Commission split (server-authoritative; the frontend never computes money).
  const { commissionPercent } = await getMonetizationSettings();
  const { platformFee, mentorAmount } = computeSplit(amount, commissionPercent);

  const reference = `ETEN-SESS-${Date.now()}-${randomUUID().slice(0, 8)}`;

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      payer_id: me.id,
      mentor_id: input.mentorId,
      purpose: "session",
      booking_id: booking.id,
      amount,
      currency,
      commission_percent: commissionPercent,
      platform_fee: platformFee,
      mentor_amount: mentorAmount,
      reference,
      status: "pending",
    })
    .select("id")
    .single();
  if (payErr || !payment) {
    await admin.from("session_bookings").delete().eq("id", booking.id);
    return { error: "Couldn't start the payment. Please try again." };
  }

  // Payer email for Paystack's hosted checkout.
  const { data: userRes } = await admin.auth.admin.getUserById(me.id);
  const email = userRes?.user?.email;
  if (!email) {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    await admin.from("session_bookings").delete().eq("id", booking.id);
    return { error: "We couldn't find your email for checkout." };
  }

  const origin = await requestOrigin();
  const init = await paystackInitialize({
    email,
    amountMinor: amount,
    currency,
    reference,
    callbackUrl: `${origin}/mentorship/checkout/return`,
    metadata: {
      purpose: "session",
      bookingId: booking.id,
      mentorId: input.mentorId,
      menteeId: me.id,
    },
  });
  if ("error" in init) {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    await admin.from("session_bookings").delete().eq("id", booking.id);
    return { error: init.error };
  }

  return { ok: true, authorizationUrl: init.authorizationUrl };
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
