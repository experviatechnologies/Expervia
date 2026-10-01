"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import {
  saveSchedulingPrefs,
  addAvailabilityBlock,
  removeAvailabilityBlock,
  addAvailabilityException,
  removeAvailabilityException,
  type ActionResult,
} from "./actions";

export type Prefs = {
  timezone: string;
  defaultSessionMinutes: number;
  minNoticeMinutes: number;
  bufferMinutes: number;
  maxSessionsPerWeek: number | null;
  availabilityStatus: "accepting" | "limited" | "unavailable";
};

type Block = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
};
type Exception = {
  id: string;
  date: string;
  kind: "available" | "blocked";
  startTime: string | null;
  endTime: string | null;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const FALLBACK_TZS = [
  "UTC",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
];

const field =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand rounded-[10px] border px-3 py-2.5 text-[14px] outline-none";
const label = "text-mnt-ink-muted text-[12.5px] font-medium";
const btn =
  "bg-mnt-brand text-mnt-on-brand inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60";
const card = "bg-mnt-panel border-mnt-line rounded-2xl border p-5";

export function AvailabilityEditor({
  prefs,
  hasPrefs,
  blocks,
  exceptions,
}: {
  prefs: Prefs;
  hasPrefs: boolean;
  blocks: Block[];
  exceptions: Exception[];
}) {
  const router = useRouter();

  const timezones = useMemo(() => {
    let list: string[] = FALLBACK_TZS;
    try {
      const supported = (
        Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
      ).supportedValuesOf?.("timeZone");
      if (supported && supported.length) list = supported;
    } catch {
      /* fall back to the curated list */
    }
    // Make sure the saved timezone is always selectable.
    return list.includes(prefs.timezone) ? list : [prefs.timezone, ...list];
  }, [prefs.timezone]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <PrefsCard
        prefs={prefs}
        hasPrefs={hasPrefs}
        timezones={timezones}
        onDone={() => router.refresh()}
      />
      <WeeklyCard blocks={blocks} onDone={() => router.refresh()} />
      <ExceptionsCard exceptions={exceptions} onDone={() => router.refresh()} />
    </div>
  );
}

/* ------------------------------------------------------------------ Prefs */

function PrefsCard({
  prefs,
  hasPrefs,
  timezones,
  onDone,
}: {
  prefs: Prefs;
  hasPrefs: boolean;
  timezones: string[];
  onDone: () => void;
}) {
  const [timezone, setTimezone] = useState(prefs.timezone);
  const [status, setStatus] = useState(prefs.availabilityStatus);
  const [duration, setDuration] = useState(prefs.defaultSessionMinutes);
  const [notice, setNotice] = useState(prefs.minNoticeMinutes);
  const [buffer, setBuffer] = useState(prefs.bufferMinutes);
  const [maxWeek, setMaxWeek] = useState<string>(
    prefs.maxSessionsPerWeek == null ? "" : String(prefs.maxSessionsPerWeek),
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await saveSchedulingPrefs({
        timezone,
        defaultSessionMinutes: duration,
        minNoticeMinutes: notice,
        bufferMinutes: buffer,
        maxSessionsPerWeek: maxWeek.trim() === "" ? null : Number(maxWeek),
        availabilityStatus: status,
      });
      if ("error" in res) setError(res.error);
      else {
        setSaved(true);
        onDone();
      }
    });
  }

  return (
    <div className={card}>
      <div className="text-mnt-ink text-[14px] font-bold">
        Status &amp; preferences
      </div>
      <p className="text-mnt-ink-muted mt-1 text-[13px]">
        {hasPrefs
          ? "These control how your bookable slots are generated."
          : "Set these first. They control how your bookable slots are generated."}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="tz">
            Your timezone
          </label>
          <select
            id="tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={field + " mt-1.5 w-full"}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="status">
            Availability status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Prefs["availabilityStatus"])
            }
            className={field + " mt-1.5 w-full"}
          >
            <option value="accepting">Accepting requests</option>
            <option value="limited">Limited availability</option>
            <option value="unavailable">Currently unavailable</option>
          </select>
        </div>

        <div>
          <label className={label} htmlFor="duration">
            Default session length
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={field + " mt-1.5 w-full"}
          >
            {[20, 30, 40, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="notice">
            Minimum booking notice
          </label>
          <select
            id="notice"
            value={notice}
            onChange={(e) => setNotice(Number(e.target.value))}
            className={field + " mt-1.5 w-full"}
          >
            <option value={0}>No minimum</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
            <option value={720}>12 hours</option>
            <option value={1440}>1 day</option>
            <option value={2880}>2 days</option>
          </select>
        </div>

        <div>
          <label className={label} htmlFor="buffer">
            Buffer between sessions
          </label>
          <select
            id="buffer"
            value={buffer}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className={field + " mt-1.5 w-full"}
          >
            {[0, 5, 10, 15, 30].map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "None" : `${m} minutes`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="maxweek">
            Max sessions per week
          </label>
          <input
            id="maxweek"
            type="number"
            min={1}
            value={maxWeek}
            onChange={(e) => setMaxWeek(e.target.value)}
            placeholder="No limit"
            className={field + " mt-1.5 w-full"}
          />
        </div>
      </div>

      {error && <p className="text-destructive mt-3 text-[12.5px]">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={btn} disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save preferences"}
        </button>
        {saved && (
          <span className="text-mnt-green inline-flex items-center gap-1 text-[12.5px]">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Weekly */

function WeeklyCard({
  blocks,
  onDone,
}: {
  blocks: Block[];
  onDone: () => void;
}) {
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  return (
    <div className={card}>
      <div className="text-mnt-ink text-[14px] font-bold">Weekly schedule</div>
      <p className="text-mnt-ink-muted mt-1 text-[13px]">
        Recurring blocks when you&apos;re usually free. Times are in your
        timezone.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={label} htmlFor="weekday">
            Day
          </label>
          <select
            id="weekday"
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className={field + " mt-1.5 w-full"}
          >
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="start">
            From
          </label>
          <input
            id="start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={field + " mt-1.5 w-full [color-scheme:dark]"}
          />
        </div>
        <div>
          <label className={label} htmlFor="end">
            To
          </label>
          <input
            id="end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={field + " mt-1.5 w-full [color-scheme:dark]"}
          />
        </div>
        <button
          type="button"
          className={btn}
          disabled={pending}
          onClick={() =>
            run(() => addAvailabilityBlock({ weekday, startTime, endTime }))
          }
        >
          <Plus className="size-4" /> Add
        </button>
      </div>

      {error && <p className="text-destructive mt-3 text-[12.5px]">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {blocks.length === 0 ? (
          <p className="text-mnt-faint text-[13px]">No weekly blocks yet.</p>
        ) : (
          blocks.map((b) => (
            <div
              key={b.id}
              className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between rounded-xl border px-3.5 py-2.5"
            >
              <span className="text-[13.5px]">
                <span className="font-semibold">{WEEKDAYS[b.weekday]}</span>
                <span className="text-mnt-ink-muted">
                  {" "}
                  · {b.startTime} to {b.endTime}
                </span>
              </span>
              <button
                type="button"
                aria-label="Remove block"
                className="text-mnt-faint hover:text-destructive transition"
                disabled={pending}
                onClick={() => run(() => removeAvailabilityBlock(b.id))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Exceptions */

function ExceptionsCard({
  exceptions,
  onDone,
}: {
  exceptions: Exception[];
  onDone: () => void;
}) {
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<"available" | "blocked">("blocked");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  const needsTimes = kind === "available";

  return (
    <div className={card}>
      <div className="text-mnt-ink text-[14px] font-bold">Date exceptions</div>
      <p className="text-mnt-ink-muted mt-1 text-[13px]">
        Override a specific date: block time off (leave times empty to block the
        whole day) or add extra availability.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className={label} htmlFor="excdate">
            Date
          </label>
          <input
            id="excdate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={field + " mt-1.5 w-full [color-scheme:dark]"}
          />
        </div>
        <div>
          <label className={label} htmlFor="kind">
            Type
          </label>
          <select
            id="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "available" | "blocked")}
            className={field + " mt-1.5 w-full"}
          >
            <option value="blocked">Block time off</option>
            <option value="available">Extra availability</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="excstart">
            From {needsTimes ? "" : "(optional)"}
          </label>
          <input
            id="excstart"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={field + " mt-1.5 w-full [color-scheme:dark]"}
          />
        </div>
        <div>
          <label className={label} htmlFor="excend">
            To {needsTimes ? "" : "(optional)"}
          </label>
          <input
            id="excend"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={field + " mt-1.5 w-full [color-scheme:dark]"}
          />
        </div>
        <button
          type="button"
          className={btn}
          disabled={pending || !date}
          onClick={() =>
            run(() =>
              addAvailabilityException({
                date,
                kind,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
              }),
            )
          }
        >
          <Plus className="size-4" /> Add
        </button>
      </div>

      {error && <p className="text-destructive mt-3 text-[12.5px]">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {exceptions.length === 0 ? (
          <p className="text-mnt-faint text-[13px]">No date exceptions.</p>
        ) : (
          exceptions.map((e) => (
            <div
              key={e.id}
              className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between rounded-xl border px-3.5 py-2.5"
            >
              <span className="text-[13.5px]">
                <span className="font-semibold">{e.date}</span>
                <span className="text-mnt-ink-muted">
                  {" "}
                  · {e.kind === "available" ? "Extra availability" : "Blocked"}
                  {e.startTime && e.endTime
                    ? ` ${e.startTime} to ${e.endTime}`
                    : e.kind === "blocked"
                      ? " (whole day)"
                      : ""}
                </span>
              </span>
              <button
                type="button"
                aria-label="Remove exception"
                className="text-mnt-faint hover:text-destructive transition"
                disabled={pending}
                onClick={() => run(() => removeAvailabilityException(e.id))}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
