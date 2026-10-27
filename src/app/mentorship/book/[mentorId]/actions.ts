"use server";

import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMentorSlots } from "@/lib/eten/availability";
import { getMonetizationSettings, computeSplit } from "@/lib/eten/monetization";
import { paystackInitialize, isPaystackConfigured } from "@/lib/eten/paystack";
import { requestOrigin } from "@/lib/eten/request-origin";

export type GuestBookingResult =
  | { ok: true; authorizationUrl: string }
  | { error: string };

export type SessionTier = "standard" | "specialist" | "expert";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TIER_COLUMN: Record<SessionTier, string> = {
  standard: "standard_amount",
  specialist: "specialist_amount",
  expert: "expert_amount",
};

/**
 * Find an existing auth user id by email. Supabase has no getByEmail, so for a
 * returning guest we fall back to a bounded scan of the user list. New guests
 * (the common case) never reach this, we try the invite first.
 */
async function findUserIdByEmail(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<string | null> {
  const needle = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    const hit = data.users.find((u) => u.email?.toLowerCase() === needle);
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

/**
 * Provision (or reuse) an ETEN member for a guest email, so a public booking
 * can flow through the same member-centric pipeline as an authenticated one.
 * A brand-new guest gets an unclaimed account (the on-auth trigger creates the
 * members/profiles rows); claiming it is handled separately.
 */
async function resolveGuestMember(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
  fullName: string,
): Promise<{ id: string } | { error: string }> {
  const invite = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { full_name: fullName, origin: "guest_booking" } },
  });
  if (!invite.error && invite.data?.user) {
    // New account: make sure the profile carries the name they gave us.
    await admin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("member_id", invite.data.user.id);
    return { id: invite.data.user.id };
  }

  // Already registered (or invite blocked): reuse the existing member.
  const existingId = await findUserIdByEmail(admin, email);
  if (existingId) return { id: existingId };

  return {
    error:
      "We couldn't set up your booking with that email. Please try another.",
  };
}

/**
 * Public, unauthenticated session booking. A guest picks a paid session type
 * and a slot; we re-validate the slot server-side (the UI is never trusted),
 * provision/reuse their member, create a held pending booking + a pending
 * payment, and hand back a Paystack checkout URL. The booking is confirmed into
 * a session only once the payment settles (webhook / return page), exactly like
 * the authenticated paid flow.
 */
export async function createGuestBooking(input: {
  mentorId: string;
  startsAt: string;
  tier: SessionTier;
  name: string;
  email: string;
  goal?: string;
}): Promise<GuestBookingResult> {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const goal = (input.goal ?? "").trim().slice(0, 1000) || null;
  const tier: SessionTier = (
    ["standard", "specialist", "expert"] as const
  ).includes(input.tier)
    ? input.tier
    : "standard";

  if (name.length < 2) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email so we can send the link." };
  }
  if (!isPaystackConfigured()) {
    return { error: "Payments aren't available right now." };
  }

  const startMs = Date.parse(input.startsAt ?? "");
  if (Number.isNaN(startMs)) return { error: "Please pick a valid time." };

  const admin = getSupabaseAdmin();

  const { data: mentor } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", input.mentorId)
    .maybeSingle();
  if (!mentor || mentor.mentor_status === "candidate") {
    return { error: "That mentor isn't available." };
  }

  // Pricing for the chosen tier; the mentor must have paid sessions on.
  const { data: pricing } = await admin
    .from("mentor_pricing")
    .select(
      "paid_sessions_enabled, currency, standard_amount, specialist_amount, expert_amount",
    )
    .eq("member_id", input.mentorId)
    .maybeSingle();
  if (!pricing?.paid_sessions_enabled) {
    return { error: "This mentor isn't taking paid sessions right now." };
  }
  const amount = pricing[TIER_COLUMN[tier] as keyof typeof pricing] as
    | number
    | null;
  if (!amount || amount <= 0) {
    return { error: "That session type isn't available. Please pick another." };
  }
  const currency = pricing.currency;

  // Re-generate slots and confirm the requested time is still open.
  const { slots, durationMinutes } = await getMentorSlots(input.mentorId, {
    days: 60,
  });
  const slot = slots.find((s) => Date.parse(s.start) === startMs);
  if (!slot) {
    return { error: "That time is no longer available. Please pick another." };
  }

  const member = await resolveGuestMember(admin, email, name);
  if ("error" in member) return { error: member.error };
  const menteeId = member.id;
  if (menteeId === input.mentorId) {
    return { error: "You can't book a session with yourself." };
  }

  // Friendly pre-check; the partial unique index is the real guard.
  const { data: existing } = await admin
    .from("session_bookings")
    .select("id")
    .eq("mentee_id", menteeId)
    .eq("mentor_id", input.mentorId)
    .eq("starts_at", new Date(startMs).toISOString())
    .in("status", ["pending", "accepted"])
    .maybeSingle();
  if (existing) {
    return { error: "This time is already held under your email." };
  }

  const { data: booking, error: bookErr } = await admin
    .from("session_bookings")
    .insert({
      mentor_id: input.mentorId,
      mentee_id: menteeId,
      starts_at: new Date(startMs).toISOString(),
      duration_minutes: slot.durationMinutes || durationMinutes,
      session_type: tier,
    })
    .select("id")
    .single();
  if (bookErr || !booking) {
    if (bookErr?.code === "23505") {
      return { error: "This time is already held under your email." };
    }
    return { error: "Couldn't start that booking. Please try again." };
  }

  // Server-authoritative commission split (the frontend never computes money).
  const { commissionPercent } = await getMonetizationSettings();
  const { platformFee, mentorAmount } = computeSplit(amount, commissionPercent);
  const reference = `ETEN-SESS-${Date.now()}-${randomUUID().slice(0, 8)}`;

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      payer_id: menteeId,
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

  const origin = await requestOrigin();
  const init = await paystackInitialize({
    email,
    amountMinor: amount,
    currency,
    reference,
    callbackUrl: `${origin}/mentorship/book/${input.mentorId}/return`,
    metadata: {
      purpose: "session",
      bookingId: booking.id,
      mentorId: input.mentorId,
      menteeId,
      guest: true,
      // Captured with the payment; surfacing it to the mentor needs a
      // dedicated column (follow-up), so it isn't written to the booking yet.
      goal: goal ?? "",
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
