"use server";

import { randomUUID } from "crypto";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getMonetizationSettings, computeSplit } from "@/lib/eten/monetization";
import { paystackInitialize, isPaystackConfigured } from "@/lib/eten/paystack";
import { requestOrigin } from "@/lib/eten/request-origin";

/** V1 fixed extension length (PRD: +30 minutes, max one per session). */
const EXTENSION_MINUTES = 30;

/**
 * Begin a PAID session extension (Monetization M-4). The mentee (an enrolled
 * member of the session's Circle) pays to add EXTENSION_MINUTES to a live 1:1
 * session. Validates eligibility, enforces "at most one extension", creates a
 * pending extension + pending payment, and returns the Paystack checkout URL.
 * The extension only activates once the payment is backend-verified.
 */
export async function startExtensionPayment(input: {
  sessionId: string;
}): Promise<{ ok: true; authorizationUrl: string } | { error: string }> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (!isPaystackConfigured()) {
    return { error: "Payments aren't available right now." };
  }

  const admin = getSupabaseAdmin();

  const { data: session } = await admin
    .from("circle_sessions")
    .select("id, circle_id")
    .eq("id", input.sessionId)
    .maybeSingle();
  if (!session) return { error: "Session not found." };

  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("mentor_id")
    .eq("id", session.circle_id)
    .maybeSingle();
  if (!circle) return { error: "Session not found." };
  if (circle.mentor_id === me.id) {
    return { error: "Mentors don't pay to extend a session." };
  }
  const mentorId = circle.mentor_id;

  // The caller must be an enrolled member of this Circle (the mentee).
  const { data: membership } = await admin
    .from("circle_memberships")
    .select("member_id")
    .eq("circle_id", session.circle_id)
    .eq("member_id", me.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return { error: "You're not part of this session." };

  // Mentor must offer paid extensions with a price.
  const { data: pricing } = await admin
    .from("mentor_pricing")
    .select("extension_enabled, extension_amount, currency")
    .eq("member_id", mentorId)
    .maybeSingle();
  if (!pricing?.extension_enabled || !pricing.extension_amount) {
    return { error: "This mentor doesn't offer paid extensions." };
  }
  const amount = pricing.extension_amount;
  const currency = pricing.currency;

  // Max one extension per session.
  const { data: active } = await admin
    .from("session_extensions")
    .select("id")
    .eq("session_id", session.id)
    .eq("status", "active")
    .maybeSingle();
  if (active) return { error: "This session has already been extended." };

  // Drop any stale pending attempts (abandoned checkouts) for this session.
  await admin
    .from("session_extensions")
    .update({ status: "cancelled" })
    .eq("session_id", session.id)
    .eq("status", "pending");

  const { data: ext, error: extErr } = await admin
    .from("session_extensions")
    .insert({
      session_id: session.id,
      mentor_id: mentorId,
      mentee_id: me.id,
      minutes: EXTENSION_MINUTES,
      amount,
      currency,
      status: "pending",
    })
    .select("id")
    .single();
  if (extErr || !ext) {
    return { error: "Couldn't start the extension. Please try again." };
  }

  const { commissionPercent } = await getMonetizationSettings();
  const { platformFee, mentorAmount } = computeSplit(amount, commissionPercent);
  const reference = `ETEN-EXT-${Date.now()}-${randomUUID().slice(0, 8)}`;

  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      payer_id: me.id,
      mentor_id: mentorId,
      purpose: "extension",
      extension_id: ext.id,
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
    await admin
      .from("session_extensions")
      .update({ status: "cancelled" })
      .eq("id", ext.id);
    return { error: "Couldn't start the payment. Please try again." };
  }
  await admin
    .from("session_extensions")
    .update({ payment_id: payment.id })
    .eq("id", ext.id);

  const { data: userRes } = await admin.auth.admin.getUserById(me.id);
  const email = userRes?.user?.email;
  if (!email) {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    await admin
      .from("session_extensions")
      .update({ status: "cancelled" })
      .eq("id", ext.id);
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
      purpose: "extension",
      extensionId: ext.id,
      sessionId: session.id,
      circleId: session.circle_id,
      mentorId,
      menteeId: me.id,
    },
  });
  if ("error" in init) {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    await admin
      .from("session_extensions")
      .update({ status: "cancelled" })
      .eq("id", ext.id);
    return { error: init.error };
  }

  return { ok: true, authorizationUrl: init.authorizationUrl };
}
