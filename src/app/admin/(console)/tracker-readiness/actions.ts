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
