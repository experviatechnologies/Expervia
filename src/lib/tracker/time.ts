/**
 * Time-zone helpers for the tracker. All instants are stored as ISO UTC; wall
 * times ("HH:mm") and dates ("YYYY-MM-DD") are always paired with an IANA zone
 * (PRD FR-012, default Africa/Lagos). Built on Intl so DST-observing zones
 * convert correctly without a date library.
 */
import type { Weekday } from "./types";

export const DEFAULT_TZ = "Africa/Lagos";

export const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Berlin",
  "Asia/Dubai",
  "America/New_York",
  "America/Toronto",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

export const WEEKDAYS: { day: Weekday; label: string; short: string }[] = [
  { day: 1, label: "Monday", short: "Mon" },
  { day: 2, label: "Tuesday", short: "Tue" },
  { day: 3, label: "Wednesday", short: "Wed" },
  { day: 4, label: "Thursday", short: "Thu" },
  { day: 5, label: "Friday", short: "Fri" },
  { day: 6, label: "Saturday", short: "Sat" },
  { day: 7, label: "Sunday", short: "Sun" },
];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: Weekday;
};

const WEEKDAY_INDEX: Record<string, Weekday> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const partsCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string) {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    partsCache.set(tz, f);
  }
  return f;
}

export function zonedParts(instant: Date | string | number, tz: string): Parts {
  const d = new Date(instant);
  const out: Record<string, string> = {};
  for (const p of partsFormatter(tz).formatToParts(d)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    weekday: WEEKDAY_INDEX[out.weekday] ?? 1,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" of an instant in a zone. */
export function zonedDate(instant: Date | string | number, tz: string) {
  const p = zonedParts(instant, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "HH:mm" of an instant in a zone. */
export function zonedTime(instant: Date | string | number, tz: string) {
  const p = zonedParts(instant, tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Convert a wall-clock date + time in `tz` to a UTC Date. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes settle the offset, including across DST transitions.
  let ts = guess;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(ts, tz);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    ts = guess - (asUtc - ts);
  }
  return new Date(ts);
}

/** ISO weekday of a "YYYY-MM-DD" calendar date. */
export function weekdayOf(date: string): Weekday {
  const [y, m, d] = date.split("-").map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (js === 0 ? 7 : js) as Weekday;
}

export function addDaysToDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + days * DAY);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(mins: number): string {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

/** Short zone label, e.g. "WAT" for Africa/Lagos. */
export function tzLabel(tz: string, at: Date | string = new Date()): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    timeZoneName: "short",
  })
    .formatToParts(new Date(at))
    .find((x) => x.type === "timeZoneName");
  const v = p?.value ?? tz;
  if (tz === "Africa/Lagos") return "WAT";
  return v;
}

/** "Tue, 3 Nov 2026" */
export function fmtDate(instant: Date | string, tz = DEFAULT_TZ) {
  return new Date(instant).toLocaleDateString("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "3 Nov 2026, 15:00 WAT" */
export function fmtDateTime(instant: Date | string, tz = DEFAULT_TZ) {
  const d = new Date(instant).toLocaleDateString("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${d}, ${zonedTime(instant, tz)} ${tzLabel(tz, instant)}`;
}

/** "Tue, 3 Nov 2026 · 15:00–16:00 WAT" */
export function fmtRange(start: string, end: string, tz = DEFAULT_TZ) {
  return `${fmtDate(start, tz)} · ${zonedTime(start, tz)}–${zonedTime(end, tz)} ${tzLabel(tz, start)}`;
}

/** "Sat, 31 Oct 2026" for a calendar date string. */
export function fmtCalendarDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "5 hours ago", "3 days ago", "just now". */
export function fmtAgo(instant: string, now = Date.now()) {
  const diff = now - new Date(instant).getTime();
  if (diff < 60_000) return "just now";
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(diff / HOUR);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(diff / DAY);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Compact countdown: "19 h", "2 d", "45 min". Negative means overdue. */
export function fmtDuration(ms: number) {
  const abs = Math.abs(ms);
  if (abs < HOUR) return `${Math.max(1, Math.round(abs / 60_000))} min`;
  if (abs < 2 * DAY) return `${Math.round(abs / HOUR)} h`;
  return `${Math.round(abs / DAY)} d`;
}

export function dueLabel(dueIso: string, now = Date.now()) {
  const ms = new Date(dueIso).getTime() - now;
  return ms >= 0
    ? { text: `Due in ${fmtDuration(ms)}`, overdue: false }
    : { text: `Overdue by ${fmtDuration(ms)}`, overdue: true };
}

/** Whole hours between two instants (one decimal). */
export function hoursBetween(a: string, b: string) {
  return (
    Math.round(((new Date(b).getTime() - new Date(a).getTime()) / HOUR) * 10) /
    10
  );
}

export { HOUR, DAY };
