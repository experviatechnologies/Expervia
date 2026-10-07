import { getSupabaseAdmin } from "@/lib/supabase";
import { getMonetizationSettings } from "@/lib/eten/monetization";

type Admin = ReturnType<typeof getSupabaseAdmin>;

/**
 * Record a mentor earning for a successful payment (Monetization M-5). One
 * earning per payment (unique payment_id). The earning clears the settlement
 * hold at `available_at` = the session's scheduled end + the platform hold, so
 * availability needs no cron, it's derived from this timestamp on read.
 *
 * Idempotent: a duplicate call (webhook + return page) is a no-op via the
 * pre-check and the unique constraint.
 */
export async function recordMentorEarning(
  admin: Admin,
  paymentId: string,
): Promise<void> {
  const { data: payment } = await admin
    .from("payments")
    .select(
      "id, mentor_id, purpose, booking_id, extension_id, mentor_amount, platform_fee, payment_fee, currency, status",
    )
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment || payment.status !== "success") return;

  // Idempotency: one earning per payment.
  const { data: existing } = await admin
    .from("mentor_earnings")
    .select("id")
    .eq("payment_id", payment.id)
    .maybeSingle();
  if (existing) return;

  // Resolve the session so the hold is based on when the session actually ends.
  let sessionId: string | null = null;
  if (payment.purpose === "session" && payment.booking_id) {
    const { data: booking } = await admin
      .from("session_bookings")
      .select("session_id")
      .eq("id", payment.booking_id)
      .maybeSingle();
    sessionId = booking?.session_id ?? null;
  } else if (payment.purpose === "extension" && payment.extension_id) {
    const { data: ext } = await admin
      .from("session_extensions")
      .select("session_id")
      .eq("id", payment.extension_id)
      .maybeSingle();
    sessionId = ext?.session_id ?? null;
  }

  let sessionEndMs: number | null = null;
  if (sessionId) {
    const { data: sess } = await admin
      .from("circle_sessions")
      .select("starts_at, duration_minutes")
      .eq("id", sessionId)
      .maybeSingle();
    if (sess?.starts_at) {
      sessionEndMs =
        Date.parse(sess.starts_at) + (sess.duration_minutes ?? 40) * 60_000;
    }
  }

  const { settlementHoldHours } = await getMonetizationSettings();
  const base = sessionEndMs ?? Date.now();
  const availableAt = new Date(
    base + settlementHoldHours * 3_600_000,
  ).toISOString();

  // V1: ETEN absorbs the provider fee; the mentor's net is their post-commission
  // share. platform_fee / payment_fee / tax are recorded for reconciliation.
  const gross = payment.mentor_amount;
  const net = gross;

  const { error } = await admin.from("mentor_earnings").insert({
    mentor_id: payment.mentor_id,
    payment_id: payment.id,
    session_id: sessionId,
    extension_id: payment.purpose === "extension" ? payment.extension_id : null,
    gross_amount: gross,
    platform_fee: payment.platform_fee,
    payment_fee: payment.payment_fee ?? 0,
    tax: 0,
    net_amount: net,
    currency: payment.currency,
    status: "pending",
    available_at: availableAt,
  });
  // 23505 = a concurrent writer already created it; that's fine.
  if (error && error.code !== "23505") {
    throw new Error("Failed to record mentor earning");
  }
}

export type EarningsSummary = {
  currency: string;
  availableMinor: number; // cleared the hold, not yet paid out
  pendingMinor: number; // still within the settlement hold
  paidMinor: number; // already paid out
  totalEarnedMinor: number; // available + pending + paid (excludes reversed)
};

type EarningRow = {
  net_amount: number;
  status: string;
  available_at: string;
  currency: string;
};

/**
 * Fold a mentor's earning rows into balances, deriving "available" from
 * available_at vs now (no cron). Assumes a single currency per mentor in V1.
 */
export function summarizeEarnings(
  rows: EarningRow[],
  now: number = Date.now(),
): EarningsSummary {
  const summary: EarningsSummary = {
    currency: rows[0]?.currency ?? "NGN",
    availableMinor: 0,
    pendingMinor: 0,
    paidMinor: 0,
    totalEarnedMinor: 0,
  };
  for (const r of rows) {
    if (r.status === "reversed") continue;
    summary.totalEarnedMinor += r.net_amount;
    if (r.status === "paid") {
      summary.paidMinor += r.net_amount;
    } else if (Date.parse(r.available_at) <= now) {
      summary.availableMinor += r.net_amount;
    } else {
      summary.pendingMinor += r.net_amount;
    }
  }
  return summary;
}
