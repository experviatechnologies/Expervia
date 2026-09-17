"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { writeAudit } from "@/lib/eten/audit";

type VerificationStatus = "unverified" | "verified" | "rejected";
type ActionResult = { ok: true } | { error: string };

const VALID: VerificationStatus[] = ["unverified", "verified", "rejected"];

/**
 * Approve / reject / reset a member verification (identity or address).
 * Ops-only, re-verified here.
 *
 * Like certifications, this writes through the ops user's OWN session client,
 * not service_role: the guard_member_verification_review trigger only lets the
 * status/review fields change when is_operations() is true, which keys off
 * auth.uid() — a service_role write would be silently reverted.
 */
export async function reviewVerification(input: {
  id: string;
  status: VerificationStatus;
  note?: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to review verifications." };
  }
  if (!VALID.includes(input.status)) {
    return { error: "Invalid status." };
  }

  const me = await getCurrentMember();
  const supabase = await createSupabaseServerClient();

  // Fetch the kind for a precise audit action (identity vs address).
  const { data: row } = await supabase
    .from("member_verifications")
    .select("kind")
    .eq("id", input.id)
    .maybeSingle();
  if (!row) return { error: "That submission no longer exists." };

  const decided = input.status !== "unverified";
  const note = input.status === "rejected" ? input.note?.trim() || null : null;

  const { error } = await supabase
    .from("member_verifications")
    .update({
      status: input.status,
      reviewed_by: decided ? (me?.id ?? null) : null,
      reviewed_at: decided ? new Date().toISOString() : null,
      review_note: note,
    })
    .eq("id", input.id);

  if (error) {
    return { error: "Couldn't update the submission. Please try again." };
  }

  await writeAudit({
    actorId: me?.id ?? null,
    action: `${row.kind}.${input.status}`,
    targetType: "verification",
    targetId: input.id,
  });

  revalidatePath("/admin/verifications");
  return { ok: true };
}
