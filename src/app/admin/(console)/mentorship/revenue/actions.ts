"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processRefund } from "@/lib/eten/refunds";
import { writeAudit } from "@/lib/eten/audit";

export type ActionResult = { ok: true } | { error: string };

function clampNum(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/**
 * Operations update the platform monetization config (Monetization M-8):
 * commission, settlement hold, and the cancellation/refund windows. These are
 * applied to new transactions; existing payments keep their snapshotted values.
 */
export async function updateMonetizationSettings(input: {
  commissionPercent: number;
  settlementHoldHours: number;
  refundFullHours: number;
  refundPartialHours: number;
  refundPartialPercent: number;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do this." };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("mentorship_settings")
    .update({
      platform_commission_percent: clampNum(
        input.commissionPercent,
        0,
        100,
        20,
      ),
      settlement_hold_hours: clampNum(input.settlementHoldHours, 0, 720, 24),
      refund_full_hours: clampNum(input.refundFullHours, 0, 720, 24),
      refund_partial_hours: clampNum(input.refundPartialHours, 0, 720, 12),
      refund_partial_percent: clampNum(input.refundPartialPercent, 0, 100, 50),
    })
    .eq("id", true);
  if (error) return { error: "Couldn't save settings. Please try again." };

  revalidatePath("/admin/mentorship/revenue");
  return { ok: true };
}

/**
 * Operations refund a payment in full (Monetization M-8). Money only, reusing
 * the shared refund engine; cancelling any upcoming booking/session is handled
 * separately (the mentee self-cancel path covers the common case).
 */
export async function refundPayment(input: {
  paymentId: string;
  reason?: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to run refunds." };
  }
  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const { data: payment } = await admin
    .from("payments")
    .select("amount")
    .eq("id", input.paymentId)
    .maybeSingle();
  if (!payment) return { error: "Payment not found." };

  const res = await processRefund(admin, {
    paymentId: input.paymentId,
    amountMinor: payment.amount,
    reason: input.reason?.trim() || "Refunded by operations",
    initiatedBy: me?.id ?? null,
  });
  if ("error" in res) return res;

  await writeAudit({
    actorId: me?.id ?? null,
    action: "payment.refunded",
    targetType: "payment",
    targetId: input.paymentId,
    metadata: { amountMinor: res.amountMinor },
  });

  revalidatePath("/admin/mentorship/revenue");
  return { ok: true };
}
