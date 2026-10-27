"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ActionResult = { ok: true } | { error: string };

/** Mark one of the current member's notifications read. RLS scopes the write. */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "Not signed in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", member.id);

  if (error) return { error: "Couldn't update the notification." };
  revalidatePath("/notifications");
  return { ok: true };
}

/** Mark every unread notification for the current member read. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "Not signed in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", member.id)
    .eq("is_read", false);

  if (error) return { error: "Couldn't update notifications." };
  revalidatePath("/notifications");
  return { ok: true };
}
