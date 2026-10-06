import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Platform-wide monetization config and the commission math (Monetization M-2).
 * The server is the only place money is split; the frontend never computes or
 * is trusted for amounts.
 */

export type MonetizationSettings = {
  commissionPercent: number; // ETEN's cut, e.g. 20
  settlementHoldHours: number; // hold after a session before earnings release
};

const DEFAULTS: MonetizationSettings = {
  commissionPercent: 20,
  settlementHoldHours: 24,
};

/** Read the single-row platform settings, falling back to PRD defaults. */
export async function getMonetizationSettings(): Promise<MonetizationSettings> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("mentorship_settings")
    .select("platform_commission_percent, settlement_hold_hours")
    .eq("id", true)
    .maybeSingle();
  if (!data) return DEFAULTS;
  return {
    commissionPercent: Number(data.platform_commission_percent),
    settlementHoldHours: Number(data.settlement_hold_hours),
  };
}

export type Split = { platformFee: number; mentorAmount: number };

/**
 * Split a gross amount (minor units) into ETEN's commission and the mentor's
 * share. Commission is rounded to the nearest minor unit; the mentor gets the
 * remainder so the two always sum back to gross.
 */
export function computeSplit(
  grossMinor: number,
  commissionPercent: number,
): Split {
  const pct = Math.min(Math.max(commissionPercent, 0), 100);
  const platformFee = Math.round((grossMinor * pct) / 100);
  return { platformFee, mentorAmount: grossMinor - platformFee };
}
