import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Append an entry to the moderation/admin audit trail. The `audit_log` table has
 * no RLS policies (server-written only), so this always uses service_role.
 * Best-effort: a logging failure is recorded to the server console but never
 * thrown, so it can't break the action being audited.
 */
export async function writeAudit(params: {
  actorId: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from("audit_log")
      .insert({
        actor_id: params.actorId,
        action: params.action,
        target_type: params.targetType ?? null,
        target_id: params.targetId ?? null,
        reason: params.reason ?? null,
        metadata: params.metadata ?? null,
      });
  } catch (err) {
    console.error("writeAudit failed", err);
  }
}
