import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyPaystackSignature, paystackVerify } from "@/lib/eten/paystack";

export const runtime = "nodejs";

/**
 * Paystack webhook for mentorship payments (Monetization M-2).
 *
 * A payment is only ever settled here, server-side: we verify the signature,
 * record the event once (idempotent via payment_events), then re-verify the
 * transaction directly with Paystack before touching the payment row. The
 * frontend "success" screen is never trusted.
 *
 * This step settles the PAYMENT (status -> success). Confirming the linked
 * booking/extension off the back of a successful payment is wired in M-3/M-4.
 * We always return 200 for events we accept so Paystack does not retry; a 401
 * is only returned for a bad signature.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const eventType = typeof event.event === "string" ? event.event : null;
  const data = (event.data ?? {}) as Record<string, unknown>;
  const providerEventId = data.id != null ? String(data.id) : null;
  const reference = typeof data.reference === "string" ? data.reference : null;

  // Nothing actionable without a type + id; acknowledge so Paystack stops.
  if (!eventType || !providerEventId) {
    return NextResponse.json({ ok: true });
  }

  const admin = getSupabaseAdmin();

  // Idempotency gate: first writer wins. A duplicate delivery hits the unique
  // (provider, event_type, provider_event_id) index and we stop.
  const { error: insErr } = await admin.from("payment_events").insert({
    provider: "paystack",
    event_type: eventType,
    provider_event_id: providerEventId,
    reference,
    payload: event,
    status: "received",
  });
  if (insErr) {
    // 23505 = unique violation = already seen. Any other insert error: ack and
    // let Paystack's retry re-run us once the transient issue clears.
    return NextResponse.json({ ok: true, duplicate: insErr.code === "23505" });
  }

  let outcome: "processed" | "ignored" | "error" = "ignored";
  try {
    if (eventType === "charge.success" && reference) {
      await settleCharge(admin, reference);
      outcome = "processed";
    }
    // refund / dispute / payout events are handled in later steps.
  } catch {
    outcome = "error";
  }

  await admin
    .from("payment_events")
    .update({
      status: outcome,
      processed_at: new Date().toISOString(),
    })
    .eq("provider", "paystack")
    .eq("event_type", eventType)
    .eq("provider_event_id", providerEventId);

  return NextResponse.json({ ok: true });
}

/**
 * Re-verify a charge with Paystack and settle the matching payment row.
 * Guards: the transaction must actually be 'success', must match a known
 * reference, must not already be settled, and the amount must match what we
 * charged (a mismatch is flagged 'disputed', never silently accepted).
 */
async function settleCharge(
  admin: ReturnType<typeof getSupabaseAdmin>,
  reference: string,
): Promise<void> {
  const verified = await paystackVerify(reference);
  if ("error" in verified) throw new Error(verified.error);
  if (verified.status !== "success") return;

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount, currency, status")
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) return; // unknown reference, nothing of ours to settle
  if (payment.status === "success") return; // already settled, idempotent

  // Amount integrity: Paystack's verified amount must equal what we charged.
  if (verified.amountMinor !== payment.amount) {
    await admin
      .from("payments")
      .update({ status: "disputed" })
      .eq("id", payment.id);
    return;
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

  // M-3: confirm the linked session booking here (purpose = 'session');
  // M-4: activate the linked extension here (purpose = 'extension').
}
