"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type ActionResult = { ok: true } | { error: string };

/**
 * Resolve a report without touching the content (e.g. "dismissed", or
 * "actioned" after handling it elsewhere). Ops-only; written via service_role.
 */
export async function resolveReport(input: {
  reportId: string;
  status: "actioned" | "dismissed";
  note?: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to resolve reports." };
  }
  const me = await getCurrentMember();

  const { error } = await getSupabaseAdmin()
    .from("reports")
    .update({
      status: input.status,
      resolved_by: me?.id ?? null,
      resolved_at: new Date().toISOString(),
      resolution_note: input.note ?? null,
    })
    .eq("id", input.reportId);

  if (error) return { error: "Couldn't update the report. Please try again." };

  revalidatePath("/admin/reports");
  return { ok: true };
}

/**
 * Remove the content a report targets (post or comment) and mark the report
 * actioned, in one step. Ops-only; service_role removal + resolution.
 */
export async function removeReportedContent(input: {
  reportId: string;
  targetType: "post" | "comment" | "message" | "member";
  targetId: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to remove content." };
  }
  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  if (input.targetType === "post" || input.targetType === "comment") {
    const table = input.targetType === "post" ? "posts" : "comments";
    const { error } = await admin
      .from(table)
      .update({
        is_removed: true,
        removed_by: me?.id ?? null,
        removed_reason: "Removed by moderation",
      })
      .eq("id", input.targetId);
    if (error)
      return { error: "Couldn't remove the content. Please try again." };
  } else {
    return { error: "This report type can't be actioned here yet." };
  }

  await admin
    .from("reports")
    .update({
      status: "actioned",
      resolved_by: me?.id ?? null,
      resolved_at: new Date().toISOString(),
      resolution_note: "Content removed",
    })
    .eq("id", input.reportId);

  revalidatePath("/admin/reports");
  revalidatePath("/feed");
  return { ok: true };
}
