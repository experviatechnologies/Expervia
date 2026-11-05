"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  sendManualInvites,
  syncRequestEvents,
} from "@/lib/tracker/server/calendar/events";
import { auditTracker } from "@/lib/tracker/server/events";

/**
 * Retry a meeting's calendar events now instead of waiting for the
 * 15-minute job (Phase 8, step 8.5). Same reconciliation as every other
 * path, so it can't create duplicates.
 */
export async function retryEventSync(
  requestId: string,
): Promise<{ ok: true; failed: number } | { error: string }> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do that." };
  }
  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();
  const { data: req } = await admin
    .from("presales_requests")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { error: "Request not found." };

  const result = await syncRequestEvents(admin, requestId);
  await sendManualInvites(admin, requestId, result.manualMemberIds);
  if (me) {
    await auditTracker({
      actorId: me.id,
      action: "calendar_sync_retried",
      targetType: "request",
      targetId: requestId,
      metadata: {
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        failed: result.failed,
      },
    });
  }
  revalidatePath("/admin/tracker-readiness");
  return { ok: true, failed: result.failed };
}

/**
 * The rollout switch (Phase 9, step 9.3): who gets the weekly availability
 * reminder. staff = nobody yet, pilot = engineers in the chosen pods,
 * everyone = all opted-in engineers. Audited.
 */
export async function setRollout(input: {
  stage: "staff" | "pilot" | "everyone";
  pilotPodIds: string[];
}): Promise<{ ok: true } | { error: string }> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do that." };
  }
  if (!["staff", "pilot", "everyone"].includes(input.stage)) {
    return { error: "Unknown rollout stage." };
  }
  const podIds = Array.from(new Set(input.pilotPodIds ?? [])).slice(0, 50);
  if (input.stage === "pilot" && podIds.length === 0) {
    return { error: "Pick at least one pilot pod." };
  }
  const admin = getSupabaseAdmin();
  if (podIds.length) {
    const { data: pods } = await admin
      .from("pods")
      .select("id")
      .in("id", podIds);
    if ((pods ?? []).length !== podIds.length) {
      return { error: "One of those pods no longer exists." };
    }
  }
  const me = await getCurrentMember();
  const { error } = await admin
    .from("presales_settings")
    .update({
      rollout_stage: input.stage,
      pilot_pod_ids: podIds,
      updated_by: me?.id ?? null,
    })
    .eq("id", true);
  if (error) {
    return {
      error:
        error.code === "42703"
          ? "Run migration 57_presales_rollout.sql first."
          : "Couldn't save the rollout setting. Try again.",
    };
  }
  if (me) {
    await auditTracker({
      actorId: me.id,
      action: "rollout_changed",
      targetType: "settings",
      metadata: { stage: input.stage, pilot_pod_ids: podIds },
    });
  }
  revalidatePath("/admin/tracker-readiness");
  return { ok: true };
}
