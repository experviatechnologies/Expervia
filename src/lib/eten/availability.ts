import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Slot generation for mentor availability (Availability AV-3).
 *
 * Turns a mentor's recurring weekly schedule, date exceptions, scheduling
 * preferences and existing bookings into a list of conflict-free bookable
 * slots, as absolute UTC instants. The mentor's own timezone is the source of
 * truth for wall-clock times; callers (the booking UI) format the returned
 * instants into the mentee's local timezone. Mentees never see the raw
 * calendar (PRD FR-6), only these generated slots.
 */

export type AvailabilityStatus = "accepting" | "limited" | "unavailable";

export type BookableSlot = {
  start: string; // ISO UTC
  end: string; // ISO UTC
  durationMinutes: number;
};

export type MentorSlots = {
  timezone: string;
  status: AvailabilityStatus;
  durationMinutes: number;
  slots: BookableSlot[];
};

type Prefs = {
  timezone: string;
  default_session_minutes: number;
  min_notice_minutes: number;
  buffer_minutes: number;
  max_sessions_per_week: number | null;
  availability_status: AvailabilityStatus;
};

type Block = { weekday: number; start_time: string; end_time: string };
type Exc = {
  exception_date: string;
  kind: "available" | "blocked";
  start_time: string | null;
  end_time: string | null;
};
type Booking = { starts_at: string; duration_minutes: number | null };

const MS_PER_MIN = 60_000;
const MAX_SLOTS = 250;

/** "HH:MM[:SS]" -> minutes from midnight. */
function minutesOf(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/**
 * Offset (ms) between a timezone's wall clock and UTC at a given instant:
 * wallAsUtc - instant. Positive east of UTC.
 */
function tzOffsetMs(tz: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant.getTime();
}

/**
 * Convert a wall-clock time (y/m/d + minutes) in `tz` to the UTC instant.
 * Two passes settle the offset correctly across DST transitions.
 */
function wallToUtc(
  tz: string,
  y: number,
  m: number,
  d: number,
  minutes: number,
): Date {
  const naiveUtc = Date.UTC(y, m - 1, d, 0, 0) + minutes * MS_PER_MIN;
  let offset = tzOffsetMs(tz, new Date(naiveUtc));
  let utc = naiveUtc - offset;
  offset = tzOffsetMs(tz, new Date(utc));
  utc = naiveUtc - offset;
  return new Date(utc);
}

/** The calendar date (y/m/d) shown by `tz` at a given instant. */
function localYmd(
  tz: string,
  instant: Date,
): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = dtf.format(instant).split("-").map(Number);
  return { y, m, d };
}

/** Weekday (0=Sun..6=Sat) for a calendar date. */
function weekdayOf(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** ISO-ish week key (year + week number) for grouping weekly caps. */
function weekKey(y: number, m: number, d: number): string {
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7; // 1..7, Mon..Sun
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${week}`;
}

type Window = { startMin: number; endMin: number };

/** Subtract [bStart,bEnd) from a window, returning 0..2 remaining windows. */
function subtract(win: Window, bStart: number, bEnd: number): Window[] {
  if (bEnd <= win.startMin || bStart >= win.endMin) return [win];
  const out: Window[] = [];
  if (bStart > win.startMin)
    out.push({ startMin: win.startMin, endMin: bStart });
  if (bEnd < win.endMin) out.push({ startMin: bEnd, endMin: win.endMin });
  return out;
}

/** Windows for one calendar date, after applying exceptions. */
function windowsForDate(
  weekday: number,
  dateStr: string,
  blocks: Block[],
  exceptions: Exc[],
): Window[] {
  const dayExc = exceptions.filter((e) => e.exception_date === dateStr);

  // A whole-day block (blocked with no times) clears the day entirely.
  if (dayExc.some((e) => e.kind === "blocked" && !e.start_time)) return [];

  let windows: Window[] = blocks
    .filter((b) => b.weekday === weekday)
    .map((b) => ({
      startMin: minutesOf(b.start_time),
      endMin: minutesOf(b.end_time),
    }));

  // Extra-availability exceptions add windows.
  for (const e of dayExc) {
    if (e.kind === "available" && e.start_time && e.end_time) {
      windows.push({
        startMin: minutesOf(e.start_time),
        endMin: minutesOf(e.end_time),
      });
    }
  }

  // Partial block-outs subtract.
  for (const e of dayExc) {
    if (e.kind === "blocked" && e.start_time && e.end_time) {
      const bs = minutesOf(e.start_time);
      const be = minutesOf(e.end_time);
      windows = windows.flatMap((w) => subtract(w, bs, be));
    }
  }

  return windows;
}

type GenInput = {
  prefs: Prefs;
  blocks: Block[];
  exceptions: Exc[];
  bookings: Booking[];
  now: Date;
  days: number;
};

/** Pure slot generation from already-fetched data. */
export function generateSlots(input: GenInput): BookableSlot[] {
  const { prefs, blocks, exceptions, bookings, now, days } = input;
  if (prefs.availability_status === "unavailable") return [];

  const tz = prefs.timezone;
  const duration = prefs.default_session_minutes;
  const buffer = prefs.buffer_minutes;
  const earliest = now.getTime() + prefs.min_notice_minutes * MS_PER_MIN;

  // Existing bookings as [start-buffer, end+buffer) intervals in ms.
  const busy = bookings
    .map((b) => {
      const s = Date.parse(b.starts_at);
      if (Number.isNaN(s)) return null;
      const e = s + (b.duration_minutes ?? duration) * MS_PER_MIN;
      return { start: s - buffer * MS_PER_MIN, end: e + buffer * MS_PER_MIN };
    })
    .filter((x): x is { start: number; end: number } => x !== null);

  // Count existing bookings per week for the weekly cap.
  const weekCounts = new Map<string, number>();
  if (prefs.max_sessions_per_week != null) {
    for (const b of bookings) {
      const ymd = localYmd(tz, new Date(Date.parse(b.starts_at)));
      const k = weekKey(ymd.y, ymd.m, ymd.d);
      weekCounts.set(k, (weekCounts.get(k) ?? 0) + 1);
    }
  }

  const slots: BookableSlot[] = [];
  const today = localYmd(tz, now);
  const dayCount = Math.min(Math.max(days, 1), 60);

  for (let offset = 0; offset < dayCount; offset++) {
    // Advance the calendar date without timezone drift.
    const counter = new Date(Date.UTC(today.y, today.m - 1, today.d));
    counter.setUTCDate(counter.getUTCDate() + offset);
    const y = counter.getUTCFullYear();
    const m = counter.getUTCMonth() + 1;
    const d = counter.getUTCDate();
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const wk = weekKey(y, m, d);

    if (
      prefs.max_sessions_per_week != null &&
      (weekCounts.get(wk) ?? 0) >= prefs.max_sessions_per_week
    ) {
      continue;
    }

    const windows = windowsForDate(
      weekdayOf(y, m, d),
      dateStr,
      blocks,
      exceptions,
    );

    for (const w of windows) {
      for (
        let startMin = w.startMin;
        startMin + duration <= w.endMin;
        startMin += duration
      ) {
        const slotStart = wallToUtc(tz, y, m, d, startMin);
        const startMs = slotStart.getTime();
        const endMs = startMs + duration * MS_PER_MIN;
        if (startMs < earliest) continue;
        if (busy.some((b) => startMs < b.end && endMs > b.start)) continue;

        slots.push({
          start: new Date(startMs).toISOString(),
          end: new Date(endMs).toISOString(),
          durationMinutes: duration,
        });
        if (slots.length >= MAX_SLOTS) return slots;
      }
    }
  }

  return slots;
}

const DEFAULT_PREFS: Prefs = {
  timezone: "UTC",
  default_session_minutes: 40,
  min_notice_minutes: 120,
  buffer_minutes: 10,
  max_sessions_per_week: null,
  availability_status: "accepting",
};

/**
 * Fetch a mentor's availability data and return bookable slots over the next
 * `days` (default 14). Uses the admin client so slot generation never depends
 * on the viewer's RLS. If the mentor has no preferences set yet, there are no
 * slots (they haven't opened for booking).
 */
export async function getMentorSlots(
  mentorId: string,
  opts: { days?: number; now?: Date } = {},
): Promise<MentorSlots> {
  const admin = getSupabaseAdmin();
  const days = opts.days ?? 14;
  const now = opts.now ?? new Date();

  const { data: prefsRow } = await admin
    .from("mentor_scheduling_prefs")
    .select(
      "timezone, default_session_minutes, min_notice_minutes, buffer_minutes, max_sessions_per_week, availability_status",
    )
    .eq("member_id", mentorId)
    .maybeSingle();

  const prefs: Prefs = prefsRow ?? DEFAULT_PREFS;

  // No preferences row means the mentor has not opened for booking.
  if (!prefsRow || prefs.availability_status === "unavailable") {
    return {
      timezone: prefs.timezone,
      status: prefs.availability_status,
      durationMinutes: prefs.default_session_minutes,
      slots: [],
    };
  }

  const windowEnd = new Date(now.getTime() + days * 24 * 60 * MS_PER_MIN);

  const [{ data: blockRows }, { data: excRows }, { data: bookingRows }] =
    await Promise.all([
      admin
        .from("mentor_availability")
        .select("weekday, start_time, end_time")
        .eq("mentor_id", mentorId),
      admin
        .from("mentor_availability_exceptions")
        .select("exception_date, kind, start_time, end_time")
        .eq("mentor_id", mentorId),
      admin
        .from("circle_sessions")
        .select(
          "starts_at, duration_minutes, mentorship_circles!inner(mentor_id)",
        )
        .eq("mentorship_circles.mentor_id", mentorId)
        .not("starts_at", "is", null)
        .gte("starts_at", now.toISOString())
        .lte("starts_at", windowEnd.toISOString()),
    ]);

  const slots = generateSlots({
    prefs,
    blocks: (blockRows ?? []).map((b) => ({
      weekday: b.weekday,
      start_time: String(b.start_time),
      end_time: String(b.end_time),
    })),
    exceptions: (excRows ?? []).map((e) => ({
      exception_date: e.exception_date,
      kind: e.kind,
      start_time: e.start_time ? String(e.start_time) : null,
      end_time: e.end_time ? String(e.end_time) : null,
    })),
    bookings: (bookingRows ?? []).map((r) => ({
      starts_at: String(r.starts_at),
      duration_minutes: r.duration_minutes,
    })),
    now,
    days,
  });

  return {
    timezone: prefs.timezone,
    status: prefs.availability_status,
    durationMinutes: prefs.default_session_minutes,
    slots,
  };
}
