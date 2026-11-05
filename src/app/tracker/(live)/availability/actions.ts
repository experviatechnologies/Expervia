"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker } from "@/lib/tracker/server/session";
import { auditTracker } from "@/lib/tracker/server/events";
import { TIMEZONES, toMinutes } from "@/lib/tracker/time";
import type {
  AvailabilityException,
  MeetingFormat,
  WeeklyWindow,
} from "@/lib/tracker/types";

/**
 * My availability, live (Phase 4, step 4.2; PRD FR-009 to FR-013).
 *
 * One schedule per person (migration 46): these actions only create, change
 * or remove rows tagged for presales, and only the caller's own rows. A window
 * shared with mentoring is never deleted from here; dropping it from presales
 * removes just the presales tag, so mentoring bookings keep working.
 * Every save also marks the availability as reviewed (freshness, FR-013).
 */

type Result = { ok: true } | { error: string };

const FORMATS: MeetingFormat[] = ["online", "physical", "hybrid"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const REASONS = [
  "leave",
  "travel",
  "client_work",
  "training",
  "personal",
  "other",
];

/** ISO weekday (1 = Mon .. 7 = Sun) to the table's 0 = Sun .. 6 = Sat. */
const dbWeekday = (iso: number) => (iso === 7 ? 0 : iso);

async function me() {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  return { id: auth.session.member.id, admin: getSupabaseAdmin() };
}

async function touchReviewed(
  admin: ReturnType<typeof getSupabaseAdmin>,
  id: string,
) {
  // Make sure a presales profile exists (migration 49), then stamp the review.
  await admin.rpc("ensure_presales_profile", { p_member_id: id });
  await admin
    .from("presales_profiles")
    .update({ availability_reviewed_at: new Date().toISOString() })
    .eq("member_id", id);
}

/**
 * Finish a change: record it in the audit log (PRD FR-029: availability
 * changes are significant, they decide who can be selected) and refresh.
 */
async function done(id: string, action: string): Promise<Result> {
  await auditTracker({
    actorId: id,
    action,
    targetType: "member",
    targetId: id,
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}

// ------------------------------------------------------------------ weekly

export async function saveWeeklyAvailability(
  windows: WeeklyWindow[],
): Promise<Result> {
  const ctx = await me();
  if ("error" in ctx) return ctx;
  const { admin, id } = ctx;

  if (!Array.isArray(windows) || windows.length > 70)
    return { error: "Too many time windows." };
  for (const w of windows) {
    if (!(w.day >= 1 && w.day <= 7))
      return { error: "Day of week must be Monday to Sunday." };
    if (!HHMM.test(w.start) || !HHMM.test(w.end))
      return { error: "Enter times as HH:mm." };
    if (toMinutes(w.end) <= toMinutes(w.start))
      return { error: "End time must be after start time." };
    if (!w.formats?.length || w.formats.some((f) => !FORMATS.includes(f))) {
      return { error: "Choose at least one meeting format for each window." };
    }
  }
  for (let day = 1; day <= 7; day++) {
    const active = windows
      .filter((w) => w.day === day && w.active)
      .sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < active.length; i++) {
      if (toMinutes(active[i].start) < toMinutes(active[i - 1].end)) {
        return { error: "Two windows on the same day overlap." };
      }
    }
  }

  const { data: existing, error: readError } = await admin
    .from("mentor_availability")
    .select("id, purposes")
    .eq("mentor_id", id)
    .contains("purposes", ["presales"]);
  if (readError)
    return { error: "Couldn't load your availability. Try again." };
  const mine = new Map(
    (existing ?? []).map((r) => [r.id as string, r.purposes as string[]]),
  );
  const keep = new Set(
    windows.filter((w) => UUID.test(w.id) && mine.has(w.id)).map((w) => w.id),
  );

  // Removed windows: delete presales-only rows; untag shared ones.
  for (const [rowId, purposes] of mine) {
    if (keep.has(rowId)) continue;
    const { error } = purposes.includes("mentoring")
      ? await admin
          .from("mentor_availability")
          .update({ purposes: purposes.filter((p) => p !== "presales") })
          .eq("id", rowId)
          .eq("mentor_id", id)
      : await admin
          .from("mentor_availability")
          .delete()
          .eq("id", rowId)
          .eq("mentor_id", id);
    if (error)
      return { error: "Couldn't update your availability. Try again." };
  }

  for (const w of windows) {
    const row = {
      weekday: dbWeekday(w.day),
      start_time: w.start,
      end_time: w.end,
      formats: w.formats,
      is_active: w.active,
    };
    const { error } = keep.has(w.id)
      ? await admin
          .from("mentor_availability")
          .update(row)
          .eq("id", w.id)
          .eq("mentor_id", id)
      : await admin
          .from("mentor_availability")
          .insert({ ...row, mentor_id: id, purposes: ["presales"] });
    if (error) return { error: "Couldn't save your availability. Try again." };
  }

  await touchReviewed(admin, id);
  return done(id, "availability_weekly_saved");
}

export async function markAvailabilityReviewed(): Promise<Result> {
  const ctx = await me();
  if ("error" in ctx) return ctx;
  await touchReviewed(ctx.admin, ctx.id);
  return done(ctx.id, "availability_reviewed");
}

// ------------------------------------------------------------------ exceptions

export async function saveAvailabilityException(
  ex: AvailabilityException,
): Promise<Result> {
  const ctx = await me();
  if ("error" in ctx) return ctx;
  const { admin, id } = ctx;

  if (!DATE.test(ex.date) || Number.isNaN(Date.parse(ex.date)))
    return { error: "Choose a date." };
  if (!["unavailable_all", "unavailable_part", "extra"].includes(ex.kind))
    return { error: "Choose a type." };
  if (!REASONS.includes(ex.reason)) return { error: "Choose a reason." };
  const timed = ex.kind !== "unavailable_all";
  if (
    timed &&
    (!HHMM.test(ex.start ?? "") ||
      !HHMM.test(ex.end ?? "") ||
      toMinutes(ex.end!) <= toMinutes(ex.start!))
  ) {
    return { error: "End time must be after start time." };
  }

  const row = {
    exception_date: ex.date,
    // Blocks are about the person, so they apply to mentoring too; extra
    // hours are offered for presales only.
    kind: ex.kind === "extra" ? "available" : "blocked",
    purposes: ex.kind === "extra" ? ["presales"] : ["mentoring", "presales"],
    start_time: timed ? ex.start : null,
    end_time: timed ? ex.end : null,
    reason: ex.reason,
    note: ex.note?.trim() ? ex.note.trim().slice(0, 300) : null,
  };
  const { error } = UUID.test(ex.id)
    ? await admin
        .from("mentor_availability_exceptions")
        .update(row)
        .eq("id", ex.id)
        .eq("mentor_id", id)
        .contains("purposes", ["presales"])
    : await admin
        .from("mentor_availability_exceptions")
        .insert({ ...row, mentor_id: id });
  if (error) return { error: "Couldn't save that exception. Try again." };

  await touchReviewed(admin, id);
  return done(id, "availability_exception_saved");
}

export async function deleteAvailabilityException(
  exceptionId: string,
): Promise<Result> {
  const ctx = await me();
  if ("error" in ctx) return ctx;
  if (!UUID.test(exceptionId)) return { error: "Exception not found." };
  const { error } = await ctx.admin
    .from("mentor_availability_exceptions")
    .delete()
    .eq("id", exceptionId)
    .eq("mentor_id", ctx.id)
    .contains("purposes", ["presales"]);
  if (error) return { error: "Couldn't delete that exception. Try again." };
  return done(ctx.id, "availability_exception_deleted");
}

// ------------------------------------------------------------------ preferences

export async function saveMeetingPreferences(input: {
  formats?: MeetingFormat[];
  cities?: string[];
  willingToTravel?: boolean;
  travelNotes?: string;
  timezone?: string;
}): Promise<Result> {
  const ctx = await me();
  if ("error" in ctx) return ctx;
  const { admin, id } = ctx;

  if (
    !input.formats?.length ||
    input.formats.some((f) => !FORMATS.includes(f))
  ) {
    return { error: "Choose at least one meeting format." };
  }
  if (input.timezone && !TIMEZONES.includes(input.timezone))
    return { error: "Choose a supported time zone." };
  const cities = (input.cities ?? [])
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((c) => c.slice(0, 60));

  await admin.rpc("ensure_presales_profile", { p_member_id: id });
  const { error } = await admin
    .from("presales_profiles")
    .update({
      formats: input.formats,
      cities,
      willing_to_travel: Boolean(input.willingToTravel),
      travel_notes: input.travelNotes?.trim().slice(0, 300) || null,
      timezone: input.timezone ?? null,
    })
    .eq("member_id", id);
  if (error) return { error: "Couldn't save your preferences. Try again." };

  // A mentor's shared schedule keeps its zone on the scheduling prefs.
  if (input.timezone) {
    await admin
      .from("mentor_scheduling_prefs")
      .update({ timezone: input.timezone })
      .eq("member_id", id);
  }
  return done(id, "meeting_preferences_saved");
}
