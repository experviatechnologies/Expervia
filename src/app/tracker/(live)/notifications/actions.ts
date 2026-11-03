"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker } from "@/lib/tracker/server/session";

/**
 * Mark presales notifications as read (Phase 5, step 5.5). Only the caller's
 * own rows of type 'presales' are touched.
 */

type Result = { ok: true } | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function markPresalesNotificationRead(
  id: string,
): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  if (!UUID.test(id)) return { error: "Notification not found." };
  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", auth.session.member.id)
    .eq("type", "presales");
  if (error) return { error: "Couldn't update the notification." };
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

export async function markAllPresalesNotificationsRead(): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const { error } = await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", auth.session.member.id)
    .eq("type", "presales")
    .eq("is_read", false);
  if (error) return { error: "Couldn't update notifications." };
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
