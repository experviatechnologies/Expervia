"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ActionResult = { ok: true } | { error: string };

const NOTIFICATION_CATEGORIES = [
  "comment",
  "reaction",
  "message",
  "mention",
  "pod_activity",
] as const;
const NOTIFICATION_MODES = ["realtime", "digest", "off"] as const;

/** Block a member: they can no longer message you, nor you them. */
export async function blockMember(input: {
  memberId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (input.memberId === me.id) return { error: "You can't block yourself." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: me.id, blocked_id: input.memberId });
  // 23505 = already blocked; treat as success.
  if (error && error.code !== "23505") {
    return { error: "Couldn't block this member. Please try again." };
  }

  revalidatePath(`/members/${input.memberId}`);
  revalidatePath("/settings");
  return { ok: true };
}

/** Remove a block. */
export async function unblockMember(input: {
  memberId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", me.id)
    .eq("blocked_id", input.memberId);
  if (error)
    return { error: "Couldn't unblock this member. Please try again." };

  revalidatePath(`/members/${input.memberId}`);
  revalidatePath("/settings");
  return { ok: true };
}

/** Set how a member is notified for one category (realtime / digest / off). */
export async function setNotificationPreference(input: {
  category: (typeof NOTIFICATION_CATEGORIES)[number];
  mode: (typeof NOTIFICATION_MODES)[number];
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (!NOTIFICATION_CATEGORIES.includes(input.category)) {
    return { error: "Unknown notification category." };
  }
  if (!NOTIFICATION_MODES.includes(input.mode)) {
    return { error: "Unknown notification mode." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { member_id: me.id, category: input.category, mode: input.mode },
      { onConflict: "member_id,category" },
    );
  if (error)
    return { error: "Couldn't save your preference. Please try again." };

  revalidatePath("/settings");
  return { ok: true };
}
