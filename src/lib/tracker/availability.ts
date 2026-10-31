/**
 * Availability calculation rules (PRD section 7).
 *
 * 1. Resolve the meeting into the member's own time zone.
 * 2. Apply date-specific exceptions on top of the recurring weekly pattern.
 * 3. The whole meeting must fit inside one eligible window.
 * 4. Check confirmed assignments and connected-calendar busy periods.
 * 5. Check meeting format and in-person location.
 * A calendar that could not be checked is never reported as verified free.
 */
import { toMinutes, weekdayOf, zonedDate, zonedParts, DAY } from "./time";
import { FORMAT_LABEL } from "./labels";
import type {
  Assignment,
  MeetingFormat,
  Member,
  Policies,
  PresalesRequest,
} from "./types";

export type Interval = { start: number; end: number; formats: MeetingFormat[] };

/** Merged availability intervals (minutes from local midnight) for a date. */
export function effectiveWindows(member: Member, date: string): Interval[] {
  const day = weekdayOf(date);
  let windows: Interval[] = member.weekly
    .filter((w) => w.active && w.day === day)
    .map((w) => ({
      start: toMinutes(w.start),
      end: toMinutes(w.end),
      formats: w.formats,
    }));

  const exceptions = member.exceptions.filter((e) => e.date === date);
  if (exceptions.some((e) => e.kind === "unavailable_all")) return [];

  for (const e of exceptions) {
    if (e.kind === "extra" && e.start && e.end) {
      windows.push({
        start: toMinutes(e.start),
        end: toMinutes(e.end),
        formats: member.formats,
      });
    }
  }
  // Removals win over additions on the same date.
  for (const e of exceptions) {
    if (e.kind === "unavailable_part" && e.start && e.end) {
      const s = toMinutes(e.start);
      const en = toMinutes(e.end);
      windows = windows.flatMap((w) => {
        if (en <= w.start || s >= w.end) return [w];
        const parts: Interval[] = [];
        if (s > w.start) parts.push({ ...w, end: s });
        if (en < w.end) parts.push({ ...w, start: en });
        return parts;
      });
    }
  }
  windows.sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const w of windows) {
    const last = merged[merged.length - 1];
    if (last && w.start <= last.end) {
      last.end = Math.max(last.end, w.end);
      last.formats = Array.from(new Set([...last.formats, ...w.formats]));
    } else merged.push({ ...w, formats: [...w.formats] });
  }
  return merged;
}

export function weeklyMinutes(member: Member) {
  return member.weekly
    .filter((w) => w.active)
    .reduce(
      (sum, w) => sum + Math.max(0, toMinutes(w.end) - toMinutes(w.start)),
      0,
    );
}

export const hasDeclared = (m: Member) => m.weekly.some((w) => w.active);

export function isFresh(m: Member, policies: Policies, now = Date.now()) {
  if (!m.reviewedAt) return false;
  return now - new Date(m.reviewedAt).getTime() <= policies.freshDays * DAY;
}

const overlaps = (a1: number, a2: number, b1: number, b2: number) =>
  a1 < b2 && b1 < a2;

export type AvailabilityState =
  | "available"
  | "partial"
  | "unavailable"
  | "conflict"
  | "inactive";

export type CalendarCheck = "free" | "busy" | "unverified" | "not_connected";

export type Evaluation = {
  state: AvailabilityState;
  calendar: CalendarCheck;
  /** Hard problems that block confirmation. */
  blockers: string[];
  /** Soft warnings the Sales Manager should see. */
  warnings: string[];
};

export function evaluateMember(
  member: Member,
  meeting: {
    startUtc: string;
    endUtc: string;
    format: MeetingFormat;
    location?: string;
    requestId?: string;
  },
  ctx: { assignments: Assignment[]; requests: PresalesRequest[] },
): Evaluation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const s = new Date(meeting.startUtc).getTime();
  const e = new Date(meeting.endUtc).getTime();

  if (member.status !== "active") {
    return {
      state: "inactive",
      calendar: "not_connected",
      blockers: ["Member is not active and cannot receive new assignments."],
      warnings,
    };
  }

  // Declared availability, in the member's own zone.
  const tz = member.timezone;
  const date = zonedDate(s, tz);
  const sp = zonedParts(s, tz);
  const ep = zonedParts(e, tz);
  const startMin = sp.hour * 60 + sp.minute;
  let endMin = ep.hour * 60 + ep.minute;
  if (zonedDate(e, tz) !== date) endMin = 24 * 60 + endMin;

  const windows = effectiveWindows(member, date);
  const covering = windows.find((w) => w.start <= startMin && w.end >= endMin);
  let state: AvailabilityState;
  if (covering) {
    state = "available";
    if (!covering.formats.includes(meeting.format)) {
      state = "unavailable";
      blockers.push(
        `Does not take ${FORMAT_LABEL[meeting.format].toLowerCase()} meetings in this window.`,
      );
    }
  } else if (windows.some((w) => overlaps(w.start, w.end, startMin, endMin))) {
    state = "partial";
    blockers.push("Declared availability covers only part of the meeting.");
  } else {
    state = "unavailable";
    blockers.push("Not available at this time according to their schedule.");
  }

  if (!member.formats.includes(meeting.format)) {
    state = "unavailable";
    if (!blockers.some((b) => b.startsWith("Does not take")))
      blockers.push(
        `Does not take ${FORMAT_LABEL[meeting.format].toLowerCase()} meetings.`,
      );
  }

  if (meeting.format !== "online" && meeting.location) {
    const loc = meeting.location.toLowerCase();
    const local = member.cities.some((c) => c && loc.includes(c.toLowerCase()));
    if (!local && !member.willingToTravel) {
      const city =
        meeting.location.split(",").pop()?.trim() || meeting.location;
      blockers.push(`Not available for in-person meetings in ${city}.`);
      if (state === "available") state = "unavailable";
    }
  }

  // Existing commitments.
  for (const a of ctx.assignments) {
    if (a.memberId !== member.id || a.requestId === meeting.requestId) continue;
    const req = ctx.requests.find((r) => r.id === a.requestId);
    if (!req || req.status === "cancelled" || req.status === "completed")
      continue;
    if (
      !overlaps(
        s,
        e,
        new Date(req.startUtc).getTime(),
        new Date(req.endUtc).getTime(),
      )
    )
      continue;
    if (a.status === "accepted" || a.status === "confirmed") {
      blockers.push("Already committed to another meeting at this time.");
      state = "conflict";
    } else if (a.status === "invitation_pending") {
      warnings.push("Has a pending invitation for an overlapping meeting.");
    }
  }

  // Connected calendar free/busy.
  let calendar: CalendarCheck;
  if (member.calendar === "connected") {
    const busy = member.busy.some((b) =>
      overlaps(
        s,
        e,
        new Date(b.startUtc).getTime(),
        new Date(b.endUtc).getTime(),
      ),
    );
    calendar = busy ? "busy" : "free";
    if (busy) {
      blockers.push("Calendar shows a busy period during the meeting.");
      state = "conflict";
    }
  } else if (member.calendar === "none") {
    calendar = "not_connected";
    warnings.push("No calendar connected: declared availability only.");
  } else {
    calendar = "unverified";
    warnings.push(
      "Calendar could not be checked (connection expired or provider error).",
    );
  }

  return { state, calendar, blockers, warnings };
}

export const AVAILABILITY_LABEL: Record<AvailabilityState, string> = {
  available: "Available",
  partial: "Partly available",
  unavailable: "Unavailable",
  conflict: "Conflict",
  inactive: "Inactive",
};
