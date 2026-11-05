"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker } from "@/lib/tracker/server/session";
import { evaluateParticipants } from "@/lib/tracker/server/checks";
import {
  auditTracker,
  logActivity,
  notifyPresales,
} from "@/lib/tracker/server/events";
import {
  sendManualInvites,
  syncRequestEvents,
} from "@/lib/tracker/server/calendar/events";
import type { MeetingFormat } from "@/lib/tracker/types";

/**
 * Confirmation, live (Phase 5, step 5.4; PRD FR-020, FR-022 to FR-024,
 * sections 7 to 9).
 *
 * Before a meeting is confirmed the participants are rechecked with the same
 * availability rules the screens use. A hard problem (another commitment,
 * outside declared hours, wrong format or city, stepped back) blocks
 * confirmation unless an authorised fallback reason is recorded. Without
 * calendar sync, "declared availability only" is a warning, not a blocker.
 * Confirmed participants get a calendar invite (.ics) by email.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;
type Result = { ok: true } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIVE = [
  "open",
  "nominations_received",
  "selection",
  "awaiting_acceptance",
  "conflict",
];

async function loadRequest(admin: Admin, requestId: string) {
  if (!UUID.test(requestId)) return null;
  const { data } = await admin
    .from("presales_requests")
    .select(
      "id, ref, title, client, objective, status, needed, starts_at, ends_at, timezone, format, location, platform, join_link, prep_notes, owner_id",
    )
    .eq("id", requestId)
    .maybeSingle();
  return data;
}

async function seatsOf(admin: Admin, requestId: string) {
  const { data } = await admin
    .from("presales_assignments")
    .select("id, member_id, status, nomination_id, idempotency_key")
    .eq("request_id", requestId);
  return (data ?? []) as {
    id: string;
    member_id: string;
    status: string;
    nomination_id: string | null;
    idempotency_key: string;
  }[];
}

type Req = NonNullable<Awaited<ReturnType<typeof loadRequest>>>;

/** Re-run the availability rules for accepted participants and set the stage. */
async function recheckRequest(admin: Admin, req: Req) {
  const seats = (await seatsOf(admin, req.id)).filter((s) =>
    ["invitation_pending", "accepted"].includes(s.status),
  );
  const evals = await evaluateParticipants(
    admin,
    {
      id: req.id,
      startUtc: req.starts_at,
      endUtc: req.ends_at,
      format: req.format as MeetingFormat,
      location: req.location,
    },
    seats.map((s) => s.member_id),
  );
  const conflicted = seats.filter(
    (s) =>
      s.status === "accepted" && evals.get(s.member_id)?.state === "conflict",
  );
  let status = req.status as string;
  // Only requests that already have a team move between these stages.
  if (["selection", "awaiting_acceptance", "conflict"].includes(status)) {
    const next = conflicted.length
      ? "conflict"
      : seats.length >= (req.needed as number)
        ? "awaiting_acceptance"
        : "selection";
    if (next !== status) {
      await admin
        .from("presales_requests")
        .update({ status: next })
        .eq("id", req.id);
      status = next;
    }
  }
  return { seats, evals, conflicted, status };
}

// ------------------------------------------------------------------ actions

export async function recheckAvailability(requestId: string): Promise<Result> {
  const auth = await authorizeTracker("sales_manager", "admin");
  if ("error" in auth) return auth;
  const admin = getSupabaseAdmin();
  const req = await loadRequest(admin, requestId);
  if (!req) return { error: "Request not found." };
  const { conflicted } = await recheckRequest(admin, req);
  await logActivity(
    req.id,
    null,
    conflicted.length
      ? `Recheck found ${conflicted.length} participant${conflicted.length > 1 ? "s" : ""} with a conflict`
      : "Rechecked availability: no conflicts",
  );
  if (conflicted.length) {
    await notifyPresales({
      recipients: [req.owner_id, ...conflicted.map((c) => c.member_id)],
      actorId: auth.session.member.id,
      event: "calendar_conflict",
      requestId: req.id,
    });
  }
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

export async function replaceParticipant(
  assignmentId: string,
): Promise<Result> {
  const auth = await authorizeTracker("sales_manager", "admin");
  if ("error" in auth) return auth;
  const me = auth.session.member.id;
  const admin = getSupabaseAdmin();
  if (!UUID.test(assignmentId)) return { error: "Participant not found." };
  const { data: seat } = await admin
    .from("presales_assignments")
    .select("id, request_id, member_id, status, nomination_id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!seat) return { error: "Participant not found." };
  if (!["invitation_pending", "accepted", "declined"].includes(seat.status))
    return { error: "This participant can't be replaced now." };
  const req = await loadRequest(admin, seat.request_id);
  if (!req || !ACTIVE.includes(req.status))
    return {
      error:
        "Participants can only be replaced before the meeting is confirmed.",
    };

  const { error } = await admin
    .from("presales_assignments")
    .update({ status: "replaced" })
    .eq("id", assignmentId);
  if (error) return { error: "Couldn't release the participant. Try again." };
  if (seat.nomination_id)
    await admin
      .from("presales_nominations")
      .update({ status: "replaced" })
      .eq("id", seat.nomination_id);
  // Nominations closed when the team filled up are available again.
  await admin
    .from("presales_nominations")
    .update({ status: "submitted" })
    .eq("request_id", req.id)
    .eq("status", "not_selected");
  await recheckRequest(admin, req);

  const { data: prof } = await admin
    .from("profiles")
    .select("full_name")
    .eq("member_id", seat.member_id)
    .maybeSingle();
  await logActivity(
    req.id,
    me,
    `Released ${prof?.full_name ?? "a participant"} so a replacement can be selected`,
  );
  if (seat.status !== "declined") {
    await notifyPresales({
      recipients: [seat.member_id],
      actorId: me,
      event: "released",
      requestId: req.id,
    });
  }
  // Remove the event from the released participant's calendar, if any.
  await syncRequestEvents(admin, req.id);
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

export async function confirmMeeting(
  requestId: string,
  manualReason?: string,
): Promise<Result> {
  const auth = await authorizeTracker("sales_manager", "admin");
  if ("error" in auth) return auth;
  const me = auth.session.member.id;
  const admin = getSupabaseAdmin();
  const req = await loadRequest(admin, requestId);
  if (!req) return { error: "Request not found." };
  if (!["selection", "awaiting_acceptance", "conflict"].includes(req.status))
    return { error: "This meeting can't be confirmed at this stage." };
  if (new Date(req.starts_at).getTime() < Date.now())
    return { error: "The meeting time has passed. Reschedule it first." };

  // Section 7: revalidate right before confirming.
  const { seats, evals } = await recheckRequest(admin, req);
  const accepted = seats.filter((s) => s.status === "accepted");
  if (seats.some((s) => s.status === "invitation_pending"))
    return { error: "Not everyone has accepted yet." };
  if (accepted.length < (req.needed as number))
    return { error: `This meeting needs ${req.needed} accepted participants.` };

  const blocked = accepted.filter(
    (s) => (evals.get(s.member_id)?.blockers.length ?? 0) > 0,
  );
  const why = (manualReason ?? "").trim().slice(0, 500);
  if (blocked.length && !why) {
    return {
      error:
        "Some participants didn't pass the availability check. Record a fallback reason to confirm anyway.",
    };
  }

  const { error } = await admin
    .from("presales_assignments")
    // 'pending' until syncRequestEvents (below) writes the calendar event.
    .update({ status: "confirmed", sync_status: "pending" })
    .in(
      "id",
      accepted.map((s) => s.id),
    );
  if (error) return { error: "Couldn't confirm the participants. Try again." };
  const { error: reqError } = await admin
    .from("presales_requests")
    .update({ status: "confirmed" })
    .eq("id", req.id);
  if (reqError) return { error: "Couldn't confirm the meeting. Try again." };

  await logActivity(
    req.id,
    me,
    why
      ? `Confirmed the meeting with a recorded fallback: ${why}`
      : "Confirmed the meeting and sent calendar invites",
  );
  await auditTracker({
    actorId: me,
    action: "meeting_confirmed",
    targetType: "request",
    targetId: req.id,
    reason: why || null,
    metadata: { participants: accepted.map((s) => s.member_id) },
  });
  await notifyPresales({
    recipients: accepted.map((s) => s.member_id),
    actorId: me,
    event: "confirmed",
    requestId: req.id,
  });
  // Connected calendars get the event written directly; everyone else gets
  // the emailed .ics. Failures are retried by the 15-minute job.
  const sync = await syncRequestEvents(admin, req.id);
  await sendManualInvites(admin, req.id, sync.manualMemberIds);

  revalidatePath("/tracker", "layout");
  return { ok: true };
}
