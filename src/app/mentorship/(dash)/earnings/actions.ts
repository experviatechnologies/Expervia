"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export type ActionResult = { ok: true } | { error: string };

const ALLOWED_CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"] as const;

async function requireMentor(): Promise<
  | { meId: string; admin: ReturnType<typeof getSupabaseAdmin> }
  | { error: string }
> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  const admin = getSupabaseAdmin();
  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", me.id)
    .maybeSingle();
  if (!mp || mp.mentor_status === "candidate") {
    return { error: "Only verified mentors can manage payouts." };
  }
  return { meId: me.id, admin };
}

/**
 * Create or update the mentor's payout (bank) account (Monetization M-6).
 * Changing the details resets verification, so operations can re-check before a
 * payout. account_number is stored as text (leading zeros matter).
 */
export async function savePayoutAccount(input: {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode?: string;
  currency: string;
}): Promise<ActionResult> {
  const ctx = await requireMentor();
  if ("error" in ctx) return ctx;

  const bankName = (input.bankName ?? "").trim();
  const accountName = (input.accountName ?? "").trim();
  const accountNumber = (input.accountNumber ?? "").trim();
  const bankCode = (input.bankCode ?? "").trim() || null;
  const currency = (input.currency ?? "").trim().toUpperCase();

  if (!bankName) return { error: "Enter your bank name." };
  if (!accountName) return { error: "Enter the account name." };
  if (!/^\d{6,20}$/.test(accountNumber)) {
    return { error: "Enter a valid account number (digits only)." };
  }
  if (!(ALLOWED_CURRENCIES as readonly string[]).includes(currency)) {
    return { error: "Choose a supported currency." };
  }

  const { error } = await ctx.admin.from("payout_accounts").upsert(
    {
      member_id: ctx.meId,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      bank_code: bankCode,
      currency,
      verified: false,
    },
    { onConflict: "member_id" },
  );
  if (error) return { error: "Couldn't save your payout account. Try again." };

  revalidatePath("/mentorship/earnings");
  return { ok: true };
}
