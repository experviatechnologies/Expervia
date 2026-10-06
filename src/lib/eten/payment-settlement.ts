import { getSupabaseAdmin } from "@/lib/supabase";
import { paystackVerify } from "@/lib/eten/paystack";
import { confirmBookingToSession } from "@/lib/eten/booking-confirm";

type Admin = ReturnType<typeof getSupabaseAdmin>;

export type SettleOutcome =
  | "settled" // just marked success (and booking confirmed if applicable)
  | "already" // was already successful
  | "not_found" // no payment for this reference
  | "not_success" // provider says the charge isn't successful
  | "mismatch"; // amount did not match what we charged (flagged disputed)

/**
 * Settle a Paystack charge by reference, server-authoritatively. Re-verifies
 * with Paystack, guards against replays and amount tampering, marks the payment
 * success, and (for a session payment) confirms the linked booking into a
 * session. Idempotent and safe to call from both the webhook and the
 * return-from-checkout page.
 */
export async function settleChargeByReference(
  admin: Admin,
  reference: string,
): Promise<SettleOutcome> {
  const verified = await paystackVerify(reference);
  if ("error" in verified) throw new Error(verified.error);

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount, status, purpose, booking_id, mentor_id")
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) return "not_found";
  if (payment.status === "success") return "already";

  if (verified.status !== "success") return "not_success";

  // Amount integrity: Paystack's verified amount must equal what we charged.
  if (verified.amountMinor !== payment.amount) {
    await admin
      .from("payments")
      .update({ status: "disputed" })
      .eq("id", payment.id);
    return "mismatch";
  }

  await admin
    .from("payments")
    .update({
      status: "success",
      provider_transaction_id: verified.providerTransactionId,
      payment_method: verified.channel,
      payment_fee: verified.feesMinor,
      paid_at: verified.paidAt ?? new Date().toISOString(),
    })
    .eq("id", payment.id);

  // Confirm the booking off the back of a verified session payment. A conflict
  // at this point leaves the booking pending and the (successful) payment for
  // operations to refund (M-7); we don't fail the settlement.
  if (payment.purpose === "session" && payment.booking_id) {
    await confirmBookingToSession(admin, payment.booking_id, {
      createdBy: payment.mentor_id,
      note: "Confirmed on payment",
      notifyMentor: true,
    });
  }

  return "settled";
}
