"use server";

import { revalidatePath } from "next/cache";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type ActionResult = { ok: true } | { error: string };

function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Operations update the platform-wide scheduling defaults (FR-20). */
export async function updateMentorshipSettings(input: {
  defaultSessionMinutes: number;
  minNoticeMinutes: number;
  bufferMinutes: number;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do this." };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("mentorship_settings").upsert(
    {
      id: true,
      default_session_minutes: clampInt(
        input.defaultSessionMinutes,
        10,
        240,
        40,
      ),
      min_notice_minutes: clampInt(input.minNoticeMinutes, 0, 20160, 120),
      buffer_minutes: clampInt(input.bufferMinutes, 0, 240, 10),
    },
    { onConflict: "id" },
  );
  if (error) return { error: "Couldn't save settings. Please try again." };

  revalidatePath("/admin/mentorship/availability");
  return { ok: true };
}
