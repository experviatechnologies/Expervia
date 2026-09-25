"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";
import { recordRecognition } from "@/lib/eten/recognition";
import { notify } from "@/lib/eten/notifications";

type ActionResult = { ok: true } | { error: string };

/**
 * Verification Desk / Readiness Panel decision on a Mentor Candidate
 * nomination (Mentorship M1.3). Ops-only.
 *
 * Approve → the nomination is marked approved, a mentor_profiles row is created
 * (status 'verified', cell = the nomination's pod), and the verified_mentor
 * badge is awarded. Reject → the nomination is marked rejected with a reason.
 * Written via service_role after the ops check (these tables have no client
 * write policy); every decision is audit-logged.
 */
export async function decideMentorNomination(input: {
  nominationId: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to review nominations." };
  }
  if (input.decision !== "approved" && input.decision !== "rejected") {
    return { error: "Invalid decision." };
  }

  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const { data: nom } = await admin
    .from("mentor_nominations")
    .select("id, member_id, pod_id, capability_area_id, status")
    .eq("id", input.nominationId)
    .maybeSingle();
  if (!nom) return { error: "That nomination no longer exists." };
  if (nom.status !== "pending") {
    return { error: "This nomination has already been decided." };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("mentor_nominations")
    .update({
      status: input.decision,
      decision_reason: input.reason?.trim() || null,
      decided_by: me?.id ?? null,
      decided_at: now,
    })
    .eq("id", nom.id);
  if (updateError) {
    return { error: "Couldn't record the decision. Please try again." };
  }

  if (input.decision === "approved") {
    const { error: profileError } = await admin.from("mentor_profiles").upsert(
      {
        member_id: nom.member_id,
        mentor_status: "verified",
        capability_pod_id: nom.pod_id,
        capability_area_id: nom.capability_area_id,
        verified_at: now,
        verified_by: me?.id ?? null,
      },
      { onConflict: "member_id" },
    );
    if (profileError) {
      return { error: "Approved, but couldn't create the mentor profile." };
    }
    // Auto-award the Verified Mentor badge (recognition foundation, M0.3).
    await recordRecognition({
      memberId: nom.member_id,
      kind: "badge",
      badgeKey: "verified_mentor",
      label: "Verified Mentor",
      sourceType: "mentor_verification",
      sourceRef: nom.id,
      awardedBy: me?.id ?? null,
    });
  }

  await writeAudit({
    actorId: me?.id ?? null,
    action:
      input.decision === "approved" ? "mentor.verified" : "mentor.rejected",
    targetType: "member",
    targetId: nom.member_id,
    metadata: { nominationId: nom.id },
  });

  if (input.decision === "approved" && me) {
    await notify({
      recipientId: nom.member_id,
      actorId: me.id,
      type: "mentorship",
      targetType: "member",
      targetId: null,
    });
  }

  revalidatePath("/admin/mentors");
  return { ok: true };
}
