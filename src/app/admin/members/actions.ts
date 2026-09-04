"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type MemberStatus = "active" | "suspended" | "deactivated";
type ActionResult = { ok: true } | { error: string };

const VALID: MemberStatus[] = ["active", "suspended", "deactivated"];

/**
 * Change a member's account status (suspend / reactivate / deactivate).
 * Ops-only, re-verified here. Guards against foot-guns:
 *   - can't act on your own account (self-lockout)
 *   - can't suspend/deactivate another operations account
 * Written with service_role after the checks (mirrors the rest of /admin);
 * RLS members_update_ops would also allow it, but this keeps the admin path
 * uniform.
 */
export async function setMemberStatus(input: {
  memberId: string;
  status: MemberStatus;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage members." };
  }
  if (!VALID.includes(input.status)) {
    return { error: "Invalid status." };
  }

  const me = await getCurrentMember();
  if (me && me.id === input.memberId) {
    return { error: "You can't change your own account status." };
  }

  const admin = getSupabaseAdmin();

  const { data: target } = await admin
    .from("members")
    .select("id, role")
    .eq("id", input.memberId)
    .maybeSingle();
  if (!target) return { error: "That member no longer exists." };
  if (target.role === "operations") {
    return {
      error: "Operations accounts can't be suspended from here.",
    };
  }

  const { error } = await admin
    .from("members")
    .update({ status: input.status })
    .eq("id", input.memberId);
  if (error) {
    return { error: "Couldn't update the member. Please try again." };
  }

  revalidatePath("/admin/members");
  return { ok: true };
}
