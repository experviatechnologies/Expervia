"use server";

import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export type AppPlatform = "android" | "ios" | "desktop" | "other";
const PLATFORMS: AppPlatform[] = ["android", "ios", "desktop", "other"];

/**
 * Record that the signed-in member installed the ETEN app, or opened the
 * installed app, on a kind of device. Best-effort: never throws, and silently
 * does nothing for visitors who aren't signed in (or before migration 61).
 */
export async function recordAppUsage(input: {
  event: "installed" | "opened";
  platform: AppPlatform;
}): Promise<void> {
  try {
    const member = await getCurrentMember();
    if (!member) return;
    const platform = PLATFORMS.includes(input.platform)
      ? input.platform
      : "other";
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from("app_installs")
      .select("member_id")
      .eq("member_id", member.id)
      .eq("platform", platform)
      .maybeSingle();

    if (!existing) {
      const { error } = await admin.from("app_installs").insert({
        member_id: member.id,
        platform,
        installed_at: now,
        last_opened_at: input.event === "opened" ? now : null,
      });
      if (error && error.code !== "23505") {
        console.error("recordAppUsage insert failed", error.message);
      }
      return;
    }
    if (input.event === "opened") {
      await admin
        .from("app_installs")
        .update({ last_opened_at: now })
        .eq("member_id", member.id)
        .eq("platform", platform);
    }
  } catch (err) {
    console.error("recordAppUsage failed", err);
  }
}
