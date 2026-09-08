import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

export type NotificationType =
  | "mention"
  | "comment"
  | "reaction"
  | "message"
  | "pod_activity";

/**
 * Insert an in-app notification. Notifications are server-written (no member
 * INSERT policy), so this always uses service_role. Never notifies a member
 * about their own action, and honours a recipient's "off" preference for the
 * category. Best-effort: failures are logged, never thrown, so they can't break
 * the action that triggered them.
 */
export async function notify(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  targetType?: string | null;
  targetId?: string | null;
}): Promise<void> {
  if (!params.recipientId || params.recipientId === params.actorId) return;

  try {
    const admin = getSupabaseAdmin();

    const { data: pref } = await admin
      .from("notification_preferences")
      .select("mode")
      .eq("member_id", params.recipientId)
      .eq("category", params.type)
      .maybeSingle();
    if (pref?.mode === "off") return;

    await admin.from("notifications").insert({
      recipient_id: params.recipientId,
      actor_id: params.actorId,
      type: params.type,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
    });
  } catch (err) {
    console.error("notify failed", err);
  }
}
