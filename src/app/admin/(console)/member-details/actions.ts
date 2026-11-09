"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getResendClient } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { emailHtml } from "@/lib/tracker/server/email";
import { DETAIL_LABEL } from "@/lib/eten/member-details";
import { loadDetailsReport } from "@/lib/eten/details-report";

const BATCH = 100; // Resend's batch limit
const MAX_PER_RUN = 1000;

/**
 * Email a reminder to members whose details are incomplete: everyone, or one
 * pod's members. Each email names what that person still has to give. People
 * reminded in the last NUDGE_COOLDOWN_DAYS (3) days are skipped, so pressing the
 * button twice never double-sends. Every reminder is written to audit_log.
 */
export async function nudgeIncompleteMembers(input: {
  podId?: string;
}): Promise<
  | { ok: true; sent: number; skipped: number; failed: number }
  | { error: string }
> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to do that." };
  }
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!fromEmail || !process.env.RESEND_API_KEY) {
    return {
      error: "Email isn't configured (CONTACT_FROM_EMAIL, RESEND_API_KEY).",
    };
  }
  const me = await getCurrentMember();
  const report = await loadDetailsReport();

  let podName: string | null = null;
  if (input.podId) {
    podName = report.pods.find((p) => p.id === input.podId)?.name ?? null;
    if (!podName) return { error: "That pod has no members to remind." };
  }
  const scope = report.incomplete.filter(
    (m) => m.email && (!podName || m.pods.includes(podName)),
  );
  const due = scope.filter((m) => !m.lastNudged).slice(0, MAX_PER_RUN);
  const skipped = scope.length - due.length;
  if (!due.length) return { ok: true, sent: 0, skipped, failed: 0 };

  const resend = getResendClient();
  const href = `${siteConfig.url}/onboarding/details`;
  const runId = crypto.randomUUID();
  const sentIds: string[] = [];
  let failed = 0;

  for (let i = 0; i < due.length; i += BATCH) {
    const chunk = due.slice(i, i + BATCH);
    try {
      const { error } = await resend.batch.send(
        chunk.map((m) => ({
          from: fromEmail,
          to: m.email,
          subject: "Action needed: complete your ETEN details",
          html: emailHtml(
            "Please complete your ETEN details",
            `Hi ${m.name.split(" ")[0] || "there"},\nYour Pod Leader uses your contact details and CV to reach you and put you forward for client work and opportunities. Your ETEN account now asks for these before you continue.\nStill needed: ${m.missing.map((k) => DETAIL_LABEL[k]).join(", ")}.\nIt takes about two minutes.`,
            href,
            "Complete my details",
            "Expervia Technology Experts Network",
          ),
        })),
        { idempotencyKey: `details-nudge/${runId}/${i}` },
      );
      if (error) {
        console.error("details nudge batch failed", error.message);
        failed += chunk.length;
        continue;
      }
      sentIds.push(...chunk.map((m) => m.id));
    } catch (err) {
      console.error("details nudge batch failed", err);
      failed += chunk.length;
    }
  }

  if (sentIds.length) {
    const { error } = await getSupabaseAdmin()
      .from("audit_log")
      .insert(
        sentIds.map((id) => ({
          actor_id: me?.id ?? null,
          action: "member.details_nudged",
          target_type: "member",
          target_id: id,
          metadata: { run: runId, pod: podName },
        })),
      );
    if (error) console.error("details nudge audit failed", error.message);
  }

  revalidatePath("/admin/member-details");
  return { ok: true, sent: sentIds.length, skipped, failed };
}
