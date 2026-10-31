/**
 * Service-level helpers: nomination deadlines count working hours only, using
 * the configured business hours, working days and public holidays.
 */
import {
  toMinutes,
  weekdayOf,
  zonedDate,
  zonedParts,
  zonedToUtc,
  addDaysToDate,
} from "./time";
import type { Policies } from "./types";

export function addWorkingHours(
  fromMs: number,
  hours: number,
  p: Policies,
): Date {
  const tz = p.timezone;
  const open = toMinutes(p.opens);
  const close = toMinutes(p.closes);
  let remaining = Math.round(hours * 60);
  let date = zonedDate(fromMs, tz);
  const parts = zonedParts(fromMs, tz);
  let cursor = parts.hour * 60 + parts.minute;
  const isWorking = (d: string) =>
    p.workingDays.includes(weekdayOf(d)) &&
    !p.holidays.some((h) => h.date === d);

  for (let guard = 0; guard < 400; guard++) {
    if (isWorking(date)) {
      const start = Math.max(cursor, open);
      if (start < close) {
        const available = close - start;
        if (remaining <= available) {
          const m = start + remaining;
          return zonedToUtc(
            date,
            `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
            tz,
          );
        }
        remaining -= available;
      }
    }
    date = addDaysToDate(date, 1);
    cursor = 0;
  }
  return new Date(fromMs + hours * 3_600_000);
}
