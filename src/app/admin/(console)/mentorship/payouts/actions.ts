"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runMentorPayout } from "@/lib/eten/payouts";
import { writeAudit } from "@/lib/eten/audit";

export type PayoutActionResult =
  | { ok: true; amountMinor: number; currency: string; count: number }
  | { error: string };

/**
 * Operations run a payout for a mentor (Monetization M-6): sweep their available
 * earnings into a recorded manual payout and mark those earnings paid. The
 * actual bank transfer is done out-of-band for V1.
 */
export async function markMentorPayout(input: {
  mentorId: string;
}): Promise<PayoutActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to run payouts." };
  }
  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const res = await runMentorPayout(admin, input.mentorId, me?.id ?? null);
  if ("error" in res) return res;

  await writeAudit({
    actorId: me?.id ?? null,
    action: "mentor.payout",
    targetType: "member",
    targetId: input.mentorId,
    metadata: {
      amountMinor: res.amountMinor,
      currency: res.currency,
      earnings: res.count,
    },
  });

  revalidatePath("/admin/mentorship/payouts");
  return res;
}

/**
 * Operations mark a mentor's payout account as verified (or not), after checking
 * the bank details are correct. Verification is informational in V1; it does not
 * gate the payout, but records that ops confirmed the account.
 */
export async function setPayoutAccountVerified(input: {
  mentorId: string;
  verified: boolean;
}): Promise<{ ok: true } | { error: string }> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do this." };
  }
  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("payout_accounts")
    .update({ verified: Boolean(input.verified) })
    .eq("member_id", input.mentorId);
  if (error) return { error: "Couldn't update the account. Please try again." };

  await writeAudit({
    actorId: me?.id ?? null,
    action: input.verified
      ? "payout_account.verified"
      : "payout_account.unverified",
    targetType: "member",
    targetId: input.mentorId,
    metadata: {},
  });

  revalidatePath("/admin/mentorship/payouts");
  return { ok: true };
}
