import { getSupabaseAdmin } from "@/lib/supabase";
import { paystackRefund } from "@/lib/eten/paystack";
import { notify } from "@/lib/eten/notifications";
import { sendMentorshipEmail } from "@/lib/eten/mentorship-email";

type Admin = ReturnType<typeof getSupabaseAdmin>;

export type RefundPolicy = {
  fullHours: number;
  partialHours: number;
  partialPercent: number;
};

/**
 * How much (minor units) to refund for a cancellation, by how long before the
 * session start it happens (PRD §20-21). Full refund far out, partial in the
 * mid window, nothing close in or for a no-show.
 */
export function computeRefundAmount(
  policy: RefundPolicy,
  startsAtMs: number,
  now: number,
  grossMinor: number,
): number {
  const hoursUntil = (startsAtMs - now) / 3_600_000;
  if (hoursUntil >= policy.fullHours) return grossMinor;
  if (hoursUntil >= policy.partialHours) {
    return Math.round((grossMinor * policy.partialPercent) / 100);
  }
  return 0;
}

/**
 * Reconcile a refund webhook (refund.processed / refund.failed) against our
 * latest pending refund row for that transaction. Our refunds are recorded
 * optimistically on initiate, so this is a safety-net confirmation.
 */
export async function recordRefundOutcome(
  admin: Admin,
  transactionReference: string,
  processed: boolean,
): Promise<void> {
  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .eq("reference", transactionReference)
    .maybeSingle();
  if (!payment) return;

  const { data: pending } = await admin
    .from("refunds")
    .select("id")
    .eq("payment_id", payment.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pending) return;

  await admin
    .from("refunds")
    .update({
      status: processed ? "processed" : "failed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", pending.id);
}

export type RefundResult =
  | { ok: true; amountMinor: number }
  | { error: string };

/**
 * Process a refund for a payment (Monetization M-7): record it, refund via
 * Paystack, mark the payment refunded/partially_refunded, and reverse the
 * mentor earning if it hasn't been paid out. The caller owns any booking/session
 * cancellation. Money only, so it is reusable by mentee cancellation and ops.
 */
export async function processRefund(
  admin: Admin,
  input: {
    paymentId: string;
    amountMinor: number;
    reason?: string | null;
    initiatedBy: string | null;
  },
): Promise<RefundResult> {
  const { data: payment } = await admin
    .from("payments")
    .select("id, reference, amount, currency, status, booking_id, payer_id")
    .eq("id", input.paymentId)
    .maybeSingle();
  if (!payment) return { error: "Payment not found." };
  if (payment.status !== "success" && payment.status !== "partially_refunded") {
    return { error: "This payment can't be refunded." };
  }

  const amount = Math.max(
    0,
    Math.min(Math.round(input.amountMinor), payment.amount),
  );
  if (amount <= 0) return { error: "There's nothing to refund." };

  const { data: refund } = await admin
    .from("refunds")
    .insert({
      payment_id: payment.id,
      booking_id: payment.booking_id,
      amount,
      currency: payment.currency,
      reason: input.reason ?? null,
      status: "pending",
      initiated_by: input.initiatedBy,
    })
    .select("id")
    .single();

  const pr = await paystackRefund(payment.reference, amount);
  if ("error" in pr) {
    if (refund)
      await admin
        .from("refunds")
        .update({ status: "failed" })
        .eq("id", refund.id);
    return { error: pr.error };
  }

  const fullyRefunded = amount >= payment.amount;
  await admin
    .from("payments")
    .update({
      status: fullyRefunded ? "refunded" : "partially_refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // Reverse the mentor earning if it's still pending (not yet paid out). An
  // already-paid earning is left for operations to claw back manually.
  await admin
    .from("mentor_earnings")
    .update({ status: "reversed" })
    .eq("payment_id", payment.id)
    .eq("status", "pending");

  if (refund) {
    await admin
      .from("refunds")
      .update({
        status: "processed",
        provider_reference: pr.providerReference,
        processed_at: new Date().toISOString(),
      })
      .eq("id", refund.id);
  }

  await notify({
    recipientId: payment.payer_id,
    actorId: payment.payer_id,
    type: "mentorship",
    targetType: "refund_processed",
    targetId: null,
  });
  await sendMentorshipEmail(
    payment.payer_id,
    "Your refund has been initiated",
    "Refund initiated",
    "Your refund has been initiated and will arrive via your payment provider. Thanks for using ETEN Mentorship.",
  );

  return { ok: true, amountMinor: amount };
}
