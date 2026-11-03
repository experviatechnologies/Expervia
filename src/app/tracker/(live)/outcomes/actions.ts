"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker, hasRole } from "@/lib/tracker/server/session";
import { auditTracker, logActivity } from "@/lib/tracker/server/events";
import type { MeetingOutcome, OutcomeTag } from "@/lib/tracker/types";

/**
 * Meeting outcomes, live (Phase 6, step 6.1; PRD FR-026, section 8).
 *
 * Once a confirmed meeting has started, its owner (or a Sales Manager or
 * admin) records attendance for each confirmed participant, a summary, the
 * outcome, action items with owners and due dates, and commercial next steps.
 * Recording it completes the request.
 */

type Result = { ok: true } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAGS: OutcomeTag[] = ["progressed", "follow_up", "on_hold", "lost"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function recordOutcome(
  requestId: string,
  attendance: Record<string, boolean>,
  outcome: Omit<MeetingOutcome, "recordedAt" | "recordedBy">,
): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const { session } = auth;
  const me = session.member.id;
  if (!UUID.test(requestId)) return { error: "Request not found." };

  const admin = getSupabaseAdmin();
  const { data: req } = await admin
    .from("presales_requests")
    .select("id, status, starts_at, owner_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { error: "Request not found." };
  if (req.owner_id !== me && !hasRole(session, "sales_manager", "admin")) {
    return { error: "Only the meeting owner or Sales can record the outcome." };
  }
  if (req.status !== "confirmed")
    return { error: "Outcomes are recorded for confirmed meetings." };
  if (new Date(req.starts_at).getTime() > Date.now())
    return { error: "The meeting hasn't started yet." };

  const summary = String(outcome?.summary ?? "")
    .trim()
    .slice(0, 4000);
  if (!summary) return { error: "Write a short summary of the meeting." };
  if (!TAGS.includes(outcome.tag)) return { error: "Choose an outcome." };
  const actions = (outcome.actions ?? [])
    .map((a) => ({
      text: String(a.text ?? "")
        .trim()
        .slice(0, 500),
      ownerName: String(a.ownerName ?? "")
        .trim()
        .slice(0, 120),
      due: DATE.test(a.due ?? "") ? a.due : null,
    }))
    .filter((a) => a.text)
    .slice(0, 30);

  // Attendance for every confirmed participant (attended unless marked absent).
  const { data: seats } = await admin
    .from("presales_assignments")
    .select("id, member_id")
    .eq("request_id", requestId)
    .eq("status", "confirmed");
  const attended = (seats ?? [])
    .filter((s) => attendance?.[s.member_id as string] !== false)
    .map((s) => s.id as string);
  const absent = (seats ?? [])
    .filter((s) => attendance?.[s.member_id as string] === false)
    .map((s) => s.id as string);

  const { error: outcomeError } = await admin.from("presales_outcomes").insert({
    request_id: requestId,
    summary,
    tag: outcome.tag,
    next_steps:
      String(outcome.nextSteps ?? "")
        .trim()
        .slice(0, 2000) || null,
    recorded_by: me,
  });
  if (outcomeError) {
    return {
      error:
        outcomeError.code === "23505"
          ? "An outcome is already recorded for this meeting."
          : "Couldn't save the outcome. Try again.",
    };
  }
  if (actions.length) {
    const { error } = await admin.from("presales_outcome_actions").insert(
      actions.map((a) => ({
        request_id: requestId,
        text: a.text,
        owner_name: a.ownerName || null,
        due_date: a.due,
      })),
    );
    if (error) {
      // Undo the outcome so the owner can simply try again.
      await admin
        .from("presales_outcomes")
        .delete()
        .eq("request_id", requestId);
      return { error: "Couldn't save the action items. Try again." };
    }
  }
  if (attended.length)
    await admin
      .from("presales_assignments")
      .update({ status: "attended" })
      .in("id", attended);
  if (absent.length)
    await admin
      .from("presales_assignments")
      .update({ status: "absent" })
      .in("id", absent);

  const { error: statusError } = await admin
    .from("presales_requests")
    .update({ status: "completed" })
    .eq("id", requestId);
  if (statusError)
    return { error: "Couldn't complete the request. Try again." };

  await logActivity(
    requestId,
    me,
    `Recorded the meeting outcome (${outcome.tag.replace("_", " ")})`,
  );
  await auditTracker({
    actorId: me,
    action: "outcome_recorded",
    targetType: "request",
    targetId: requestId,
    metadata: {
      tag: outcome.tag,
      attended: attended.length,
      absent: absent.length,
      actions: actions.length,
    },
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
