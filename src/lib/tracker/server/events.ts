import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";
import { notify } from "@/lib/eten/notifications";
import type { PresalesEvent } from "@/lib/tracker/events";

/**
 * Side effects every tracker server action records (PRD FR-025, FR-029):
 * in-app notifications, audit entries and the per-request activity history.
 * All three are best-effort: a failure is logged and never undoes the action
 * that triggered it (calendar and notification failures must not corrupt
 * presales records, PRD section 13.2).
 */

/** Notify each recipient once; the actor is never notified of their own action. */
export async function notifyPresales(params: {
  recipients: (string | null | undefined)[];
  actorId: string;
  event: PresalesEvent;
  requestId?: string | null;
}): Promise<void> {
  const unique = Array.from(
    new Set(params.recipients.filter(Boolean)),
  ) as string[];
  await Promise.all(
    unique.map((recipientId) =>
      notify({
        recipientId,
        actorId: params.actorId,
        type: "presales",
        targetType: params.event,
        targetId: params.requestId ?? null,
      }),
    ),
  );
}

/**
 * Audit entry for a tracker action. Actions are namespaced "tracker.*" so the
 * tracker's audit view can list them without the rest of ETEN's admin trail.
 */
export async function auditTracker(params: {
  actorId: string;
  action: string;
  targetType: "request" | "member" | "settings" | "pod" | "skill";
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await writeAudit({
    actorId: params.actorId,
    action: `tracker.${params.action}`,
    targetType: params.targetType,
    targetId: params.targetId ?? null,
    reason: params.reason ?? null,
    metadata: params.metadata ?? null,
  });
}

/** Append a line to a request's activity history (actor null = the system). */
export async function logActivity(
  requestId: string,
  actorId: string | null,
  message: string,
): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin()
      .from("presales_activity")
      .insert({ request_id: requestId, actor_id: actorId, message });
    if (error) console.error("logActivity failed", error.message);
  } catch (err) {
    console.error("logActivity failed", err);
  }
}

/**
 * Notification from the tracker itself (scheduled reminders): no actor, and
 * recipients who switched presales notifications off are skipped.
 */
export async function notifySystem(params: {
  recipients: (string | null | undefined)[];
  event: PresalesEvent;
  requestId?: string | null;
}): Promise<void> {
  const ids = Array.from(
    new Set(params.recipients.filter(Boolean)),
  ) as string[];
  if (!ids.length) return;
  try {
    const admin = getSupabaseAdmin();
    const { data: off } = await admin
      .from("notification_preferences")
      .select("member_id")
      .in("member_id", ids)
      .eq("category", "presales")
      .eq("mode", "off");
    const muted = new Set((off ?? []).map((r) => r.member_id as string));
    const rows = ids
      .filter((id) => !muted.has(id))
      .map((recipient_id) => ({
        recipient_id,
        type: "presales",
        actor_id: null,
        target_type: params.event,
        target_id: params.requestId ?? null,
      }));
    if (rows.length) {
      const { error } = await admin.from("notifications").insert(rows);
      if (error) console.error("notifySystem failed", error.message);
    }
  } catch (err) {
    console.error("notifySystem failed", err);
  }
}
