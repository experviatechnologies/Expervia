"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { requestOrigin } from "@/lib/eten/request-origin";
import {
  applyRoster,
  parseRoster,
  planRoster,
  type ApplyReport,
  type RosterPlan,
} from "@/lib/tracker/server/roster-import";

const MAX_BYTES = 2 * 1024 * 1024;

/** Read-only preview of what an import would change. Ops-only. */
export async function previewRoster(
  csv: string,
): Promise<{ plan: RosterPlan } | { error: string }> {
  if (!(await isOperations()))
    return { error: "You don't have permission to import members." };
  if (!csv || csv.length > MAX_BYTES)
    return { error: "Choose a CSV file up to 2 MB." };
  const parsed = parseRoster(csv);
  if ("error" in parsed) return parsed;
  try {
    return { plan: await planRoster(getSupabaseAdmin(), parsed.rows) };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Couldn't read the file.",
    };
  }
}

/**
 * Apply an import. The plan is recomputed here from the same file (never
 * taken from the browser), so it reflects the database at the moment of
 * writing. Ops-only; audit-logged.
 */
export async function applyRosterImport(input: {
  csv: string;
  sendInvites: boolean;
}): Promise<{ report: ApplyReport; plan: RosterPlan } | { error: string }> {
  if (!(await isOperations()))
    return { error: "You don't have permission to import members." };
  const me = await getCurrentMember();
  if (!me) return { error: "Please sign in again." };
  if (!input.csv || input.csv.length > MAX_BYTES)
    return { error: "Choose a CSV file up to 2 MB." };
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (input.sendInvites && !fromEmail)
    return { error: "Email is not configured (CONTACT_FROM_EMAIL)." };

  const parsed = parseRoster(input.csv);
  if ("error" in parsed) return parsed;
  const admin = getSupabaseAdmin();
  try {
    const plan = await planRoster(admin, parsed.rows);
    const report = await applyRoster(admin, plan, {
      actorId: me.id,
      resend: getResendClient(),
      origin: await requestOrigin(),
      fromEmail: fromEmail ?? "",
      sendInvites: input.sendInvites,
    });
    revalidatePath("/admin/tracker-readiness");
    revalidatePath("/admin/pods");
    revalidatePath("/admin/migration");
    return { report, plan };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The import failed." };
  }
}
