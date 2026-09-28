"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";
import { recordRecognition } from "@/lib/eten/recognition";
import { notify } from "@/lib/eten/notifications";

type ActionResult = { ok: true } | { error: string };

/**
 * Register an existing pod leader as a verified mentor for the pilot (item 12).
 * Ops-only. Mirrors the nomination-approval path: upserts a verified
 * mentor_profiles row (with the chosen capability area and the pod they lead),
 * awards the Verified Mentor badge, audits, and notifies. Service_role writes.
 */
export async function registerPodLeaderAsMentor(input: {
  memberId: string;
  capabilityAreaId: string;
  podId?: string | null;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do this." };
  }
  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const { data: leadRows } = await admin
    .from("pod_memberships")
    .select("pod_id, role_in_pod")
    .eq("member_id", input.memberId)
    .in("role_in_pod", ["lead", "co_lead"]);
  if (!leadRows || leadRows.length === 0) {
    return { error: "That member is not a pod leader." };
  }

  const { data: area } = await admin
    .from("capability_areas")
    .select("id")
    .eq("id", input.capabilityAreaId)
    .maybeSingle();
  if (!area) return { error: "Choose a capability area." };

  const { data: existing } = await admin
    .from("mentor_profiles")
    .select("member_id")
    .eq("member_id", input.memberId)
    .maybeSingle();
  if (existing) return { error: "This member is already a mentor." };

  const now = new Date().toISOString();
  const podId = input.podId ?? leadRows[0].pod_id;

  const { error } = await admin.from("mentor_profiles").upsert(
    {
      member_id: input.memberId,
      mentor_status: "verified",
      capability_pod_id: podId,
      capability_area_id: input.capabilityAreaId,
      verified_at: now,
      verified_by: me?.id ?? null,
    },
    { onConflict: "member_id" },
  );
  if (error)
    return { error: "Couldn't register the mentor. Please try again." };

  await recordRecognition({
    memberId: input.memberId,
    kind: "badge",
    badgeKey: "verified_mentor",
    label: "Verified Mentor",
    sourceType: "pod_leader_registration",
    sourceRef: null,
    awardedBy: me?.id ?? null,
  });

  await writeAudit({
    actorId: me?.id ?? null,
    action: "mentor.verified",
    targetType: "member",
    targetId: input.memberId,
    metadata: { via: "pod_leader_registration" },
  });

  if (me) {
    await notify({
      recipientId: input.memberId,
      actorId: me.id,
      type: "mentorship",
      targetType: "member",
      targetId: null,
    });
  }

  revalidatePath("/admin/mentorship/pilot");
  return { ok: true };
}
