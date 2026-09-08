"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type VerificationStatus = "unverified" | "verified" | "rejected";
type ActionResult = { ok: true } | { error: string };

const VALID: VerificationStatus[] = ["unverified", "verified", "rejected"];

/**
 * Set a certification's verification status (verify / reject / reset to pending).
 * Ops-only, re-verified here.
 *
 * IMPORTANT: this writes through the ops user's OWN session client, NOT
 * service_role. The `guard_certification_verification` trigger only lets the
 * verification fields change when `is_operations()` is true — and that keys off
 * `auth.uid()`, which a service_role connection doesn't have. So a service_role
 * write would be silently reverted by the trigger; the ops session is what makes
 * it stick. certifications_update RLS also permits ops to update any cert.
 */
export async function setVerificationStatus(input: {
  certId: string;
  status: VerificationStatus;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to verify certifications." };
  }
  if (!VALID.includes(input.status)) {
    return { error: "Invalid status." };
  }

  const me = await getCurrentMember();
  const supabase = await createSupabaseServerClient();

  // "verified"/"rejected" are decisions we stamp with who + when; resetting to
  // "unverified" clears that provenance so the cert re-enters the queue clean.
  const decided = input.status !== "unverified";

  const { error } = await supabase
    .from("certifications")
    .update({
      verification_status: input.status,
      verified_by: decided ? (me?.id ?? null) : null,
      verified_at: decided ? new Date().toISOString() : null,
    })
    .eq("id", input.certId);

  if (error) {
    return { error: "Couldn't update the certification. Please try again." };
  }

  revalidatePath("/admin/certifications");
  return { ok: true };
}
