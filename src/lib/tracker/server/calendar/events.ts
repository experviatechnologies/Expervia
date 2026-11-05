import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { trackerUrl } from "@/lib/tracker/host";
import { sendInvites, type InviteRequest } from "../invites";
import { accessTokenFor } from "./index";
import { CalendarAuthError, type CalendarEventInput } from "./types";

/**
 * Calendar events for confirmed meetings (Phase 8, step 8.3; PRD FR-023,
 * FR-024). One function reconciles a request's seats with participants'
 * connected calendars, so confirm, reschedule, decline, replace and cancel
 * all call the same code and a retry never makes a duplicate:
 *
 *   seat should have an event  (confirmed, or rescheduled and awaiting a
 *                               new answer while it already has one)
 *     connected calendar   -> create, or update the stored event id
 *     no usable calendar   -> sync_status 'manual' (the emailed .ics is used)
 *     provider hiccup      -> sync_status 'failed' (the 15-minute job retries)
 *   seat should not have one and has one (declined, replaced, cancelled)
 *     -> delete it and clear the stored id
 *
 * Completed meetings are left alone. Calendar failures never change the
 * request or seat status (PRD: must not corrupt core presales records).
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;

type Seat = {
  id: string;
  member_id: string;
  status: string;
  sync_status: string;
  calendar_provider: string | null;
  external_event_id: string | null;
  idempotency_key: string;
};

export type EventSyncResult = {
  /**
   * Confirmed seats that have just switched to 'manual' (no usable calendar):
   * send them the .ics instead. Callers that want every manual seat re-sent
   * (confirming again after a reschedule) set those seats to 'pending' first.
   */
  manualMemberIds: string[];
  created: number;
  updated: number;
  deleted: number;
  failed: number;
};

function eventFor(req: Record<string, unknown>): CalendarEventInput {
  const where =
    req.format === "online"
      ? [req.platform, req.join_link].filter(Boolean).join(" ")
      : ((req.location as string) ?? "");
  const url = trackerUrl(`/tracker/requests/${req.id}`);
  return {
    subject: `${req.title} (${req.ref})`,
    body: [
      `Client: ${req.client}`,
      req.objective as string,
      req.prep_notes ? `Preparation: ${req.prep_notes}` : "",
      `Details and changes: ${url}`,
      "Added by the ETEN presales tracker. It is updated or removed automatically if the meeting changes.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    startUtc: req.starts_at as string,
    endUtc: req.ends_at as string,
    location: where || undefined,
  };
}

const errText = (e: unknown) =>
  (e instanceof Error ? e.message : "Unknown error").slice(0, 500);

export async function syncRequestEvents(
  admin: Admin,
  requestId: string,
): Promise<EventSyncResult> {
  const out: EventSyncResult = {
    manualMemberIds: [],
    created: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
  };
  const [{ data: req }, { data: seatRows, error: seatError }] =
    await Promise.all([
      admin
        .from("presales_requests")
        .select(
          "id, ref, title, client, objective, status, starts_at, ends_at, format, location, platform, join_link, prep_notes",
        )
        .eq("id", requestId)
        .maybeSingle(),
      admin
        .from("presales_assignments")
        .select(
          "id, member_id, status, sync_status, calendar_provider, external_event_id, idempotency_key",
        )
        .eq("request_id", requestId),
    ]);
  if (!req || seatError) return out;
  if (req.status === "completed") return out;

  const live = !["cancelled", "draft"].includes(req.status as string);
  const event = eventFor(req);
  const save = (seatId: string, patch: Record<string, unknown>) =>
    admin.from("presales_assignments").update(patch).eq("id", seatId);

  for (const seat of (seatRows ?? []) as Seat[]) {
    const wants =
      live &&
      (seat.status === "confirmed" ||
        (Boolean(seat.external_event_id) &&
          ["invitation_pending", "accepted"].includes(seat.status)));

    if (!wants && !seat.external_event_id) continue;
    const auth = await accessTokenFor(seat.member_id);
    const sameProvider =
      auth &&
      (!seat.calendar_provider || seat.calendar_provider === auth.provider.id);

    // ---------------------------------------------------- remove the event
    if (!wants) {
      try {
        if (auth && sameProvider) {
          await auth.provider.deleteEvent(auth.token, seat.external_event_id!);
          out.deleted++;
        }
        // Without a usable connection the event can't be reached (the member
        // disconnected); forget it rather than retry forever.
        await save(seat.id, {
          external_event_id: null,
          calendar_provider: null,
          sync_status: "not_synced",
          sync_error: null,
        });
      } catch (e) {
        out.failed++;
        await save(seat.id, { sync_status: "failed", sync_error: errText(e) });
      }
      continue;
    }

    // ------------------------------------------ no usable calendar: .ics
    if (!auth) {
      // Only on the change to 'manual', so a retry never re-sends the email.
      if (seat.status === "confirmed" && seat.sync_status !== "manual")
        out.manualMemberIds.push(seat.member_id);
      await save(seat.id, {
        sync_status: "manual",
        sync_error: "No connected calendar: sent as an email invite.",
      });
      continue;
    }

    // ------------------------------------------- create or update the event
    try {
      let eventId = sameProvider ? seat.external_event_id : null;
      if (eventId) {
        const found = await auth.provider.updateEvent(
          auth.token,
          eventId,
          event,
        );
        if (found) out.updated++;
        else eventId = null; // deleted by the member: add it again
      }
      if (!eventId) {
        eventId = await auth.provider.createEvent(
          auth.token,
          event,
          seat.idempotency_key,
        );
        out.created++;
      }
      await save(seat.id, {
        sync_status: "created",
        calendar_provider: auth.provider.id,
        external_event_id: eventId,
        sync_error: null,
      });
    } catch (e) {
      if (e instanceof CalendarAuthError && seat.status === "confirmed") {
        // Access was withdrawn: fall back to the email invite now.
        if (seat.sync_status !== "manual")
          out.manualMemberIds.push(seat.member_id);
        await save(seat.id, { sync_status: "manual", sync_error: errText(e) });
      } else {
        out.failed++;
        await save(seat.id, { sync_status: "failed", sync_error: errText(e) });
      }
    }
  }
  return out;
}

/**
 * Email the .ics invite to these confirmed participants (those without a
 * usable calendar). Same UID per seat as before, so it updates, never
 * duplicates, the event in their calendar app.
 */
export async function sendManualInvites(
  admin: Admin,
  requestId: string,
  memberIds: string[],
  method: "REQUEST" | "CANCEL" = "REQUEST",
): Promise<void> {
  if (!memberIds.length) return;
  const [{ data: req }, { data: seats }] = await Promise.all([
    admin
      .from("presales_requests")
      .select(
        "id, ref, title, client, objective, starts_at, ends_at, timezone, format, location, platform, join_link, prep_notes",
      )
      .eq("id", requestId)
      .maybeSingle(),
    admin
      .from("presales_assignments")
      .select("member_id, idempotency_key")
      .eq("request_id", requestId)
      .in("member_id", memberIds),
  ]);
  if (!req || !seats?.length) return;
  await sendInvites(
    admin,
    req as InviteRequest,
    seats as { member_id: string; idempotency_key: string }[],
    method,
  );
}

/**
 * The 15-minute job: retry requests whose events failed to sync. Each retry
 * runs the same reconciliation, so it can't create duplicates.
 */
export async function retryFailedEventSyncs(): Promise<Record<string, number>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("presales_assignments")
    .select("request_id")
    .in("sync_status", ["failed", "pending"])
    .limit(200);
  if (error) throw new Error(error.message);
  const ids = Array.from(
    new Set((data ?? []).map((r) => r.request_id as string)),
  );
  let fixed = 0;
  let stillFailing = 0;
  for (const id of ids.slice(0, 50)) {
    const r = await syncRequestEvents(admin, id);
    await sendManualInvites(admin, id, r.manualMemberIds);
    if (r.failed) stillFailing += r.failed;
    else fixed++;
  }
  return { event_syncs_retried: fixed, event_syncs_failing: stillFailing };
}
