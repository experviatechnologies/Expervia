import { getSupabaseAdmin } from "@/lib/supabase";

type Admin = ReturnType<typeof getSupabaseAdmin>;

export type PayoutRunResult =
  | { ok: true; amountMinor: number; currency: string; count: number }
  | { error: string };

/**
 * Run a payout for one mentor (Monetization M-6). Sweeps the mentor's AVAILABLE
 * earnings (status 'pending' and past the settlement hold) into a single
 * mentor_payouts record and marks those earnings 'paid'. V1 method is 'manual':
 * the record stands for an out-of-band (or later Paystack Transfer) payment.
 *
 * The available set is captured by id first, so only those exact earnings are
 * marked paid, and the conditional update guards against a concurrent run.
 */
export async function runMentorPayout(
  admin: Admin,
  mentorId: string,
  actorId: string | null,
  opts?: { method?: "manual" | "paystack"; note?: string | null },
): Promise<PayoutRunResult> {
  const nowIso = new Date().toISOString();

  // Available = not yet paid/reversed and past the settlement hold.
  const { data: earnings } = await admin
    .from("mentor_earnings")
    .select("id, net_amount, currency")
    .eq("mentor_id", mentorId)
    .eq("status", "pending")
    .lte("available_at", nowIso);

  const rows = earnings ?? [];
  if (rows.length === 0) {
    return { error: "This mentor has no available earnings to pay out." };
  }

  const currency = rows[0].currency;
  const amountMinor = rows
    .filter((r) => r.currency === currency)
    .reduce((sum, r) => sum + r.net_amount, 0);
  const ids = rows.filter((r) => r.currency === currency).map((r) => r.id);

  const { data: payout, error: payoutErr } = await admin
    .from("mentor_payouts")
    .insert({
      mentor_id: mentorId,
      amount: amountMinor,
      currency,
      method: opts?.method ?? "manual",
      status: "paid",
      note: opts?.note ?? null,
      created_by: actorId,
      paid_at: nowIso,
    })
    .select("id")
    .single();
  if (payoutErr || !payout) {
    return { error: "Couldn't record the payout. Please try again." };
  }

  // Mark exactly those earnings paid. The status guard prevents double-paying if
  // two runs overlap; any earning already claimed by another run is skipped.
  const { data: updated } = await admin
    .from("mentor_earnings")
    .update({ status: "paid", paid_at: nowIso, payout_id: payout.id })
    .in("id", ids)
    .eq("status", "pending")
    .select("id");

  // If a race meant some rows were already taken, correct the payout total to
  // what we actually settled (keeps the ledger consistent).
  const settled = updated ?? [];
  if (settled.length !== ids.length) {
    const settledSet = new Set(settled.map((r) => r.id));
    const realAmount = rows
      .filter((r) => settledSet.has(r.id))
      .reduce((sum, r) => sum + r.net_amount, 0);
    if (settled.length === 0) {
      await admin.from("mentor_payouts").delete().eq("id", payout.id);
      return { error: "Those earnings were just paid out. Nothing to do." };
    }
    await admin
      .from("mentor_payouts")
      .update({ amount: realAmount })
      .eq("id", payout.id);
    return {
      ok: true,
      amountMinor: realAmount,
      currency,
      count: settled.length,
    };
  }

  return { ok: true, amountMinor, currency, count: settled.length };
}
