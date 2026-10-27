"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, CalendarPlus, Check, Plus, X } from "lucide-react";
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
// Monday-first display order.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

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
  "border-mnt-line bg-mnt-panel text-mnt-ink focus:border-mnt-brand h-[46px] rounded-xl border px-3 text-[14px] outline-none";
const label = "text-mnt-ink-muted text-[12px] font-semibold";
const btn =
  "bg-mnt-brand text-mnt-on-brand inline-flex h-[46px] items-center gap-1.5 rounded-xl px-[18px] text-[14px] font-bold transition hover:brightness-110 disabled:opacity-60";
const card =
  "bg-mnt-panel border-mnt-line flex flex-col gap-[18px] rounded-[18px] border p-6";
const sectionTitle = "text-mnt-ink text-[17px] font-bold";
const sectionSub = "text-mnt-ink-muted mt-1 text-[13px] leading-relaxed";
const addBox =
  "bg-mnt-panel-2 flex flex-wrap items-end gap-2.5 rounded-[14px] p-3.5";
const errBox =
  "rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-red-600 dark:text-red-400 [background:rgba(239,68,68,0.1)]";

function minutesOf(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function AvailabilityEditor({
  prefs,
  hasPrefs,
  blocks,
  exceptions,
  pricingSlot,
}: {
  prefs: Prefs;
  hasPrefs: boolean;
  blocks: Block[];
  exceptions: Exception[];
  pricingSlot?: ReactNode;
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
    return list.includes(prefs.timezone) ? list : [prefs.timezone, ...list];
  }, [prefs.timezone]);

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-5">
        <WeeklyCard blocks={blocks} onDone={() => router.refresh()} />
        <ExceptionsCard
          exceptions={exceptions}
          onDone={() => router.refresh()}
        />
      </div>
      <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
        <PrefsCard
          prefs={prefs}
          hasPrefs={hasPrefs}
          timezones={timezones}
          onDone={() => router.refresh()}
        />
        {pricingSlot}
      </div>
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
  const [tzWarn, setTzWarn] = useState(false);

  useEffect(() => {
    let browserTz = "";
    try {
      browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      browserTz = "";
    }
    if (!browserTz || browserTz === "UTC") return;
    const t = setTimeout(() => {
      if (!hasPrefs) setTimezone((cur) => (cur === "UTC" ? browserTz : cur));
      else if (timezone === "UTC") setTzWarn(true);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div>
        <h2 className={sectionTitle}>Booking preferences</h2>
        <p className={sectionSub}>
          These control how your bookable slots are generated.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={label}>Your timezone</span>
        <select
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            setTzWarn(false);
          }}
          className={field + " w-full"}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        {tzWarn && (
          <span className="text-mnt-amber text-[12px] leading-snug">
            Your timezone is set to UTC. Pick your local timezone and save, or
            mentees will see your times shifted.
          </span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={label}>Availability status</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Prefs["availabilityStatus"])
            }
            className={field + " w-full"}
          >
            <option value="accepting">Accepting</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Session length</span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={field + " w-full"}
          >
            {[20, 30, 40, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Booking notice</span>
          <select
            value={notice}
            onChange={(e) => setNotice(Number(e.target.value))}
            className={field + " w-full"}
          >
            <option value={0}>No minimum</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
            <option value={720}>12 hours</option>
            <option value={1440}>1 day</option>
            <option value={2880}>2 days</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Buffer between</span>
          <select
            value={buffer}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className={field + " w-full"}
          >
            {[0, 5, 10, 15, 30].map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "None" : `${m} minutes`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Max per week</span>
          <input
            type="number"
            min={1}
            value={maxWeek}
            onChange={(e) => setMaxWeek(e.target.value)}
            placeholder="No limit"
            className={field + " w-full"}
          />
        </label>
      </div>

      {error && <p className={errBox}>{error}</p>}
      <div className="flex items-center gap-3">
        <button type="button" className={btn} disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save preferences"}
        </button>
        {saved && (
          <span className="text-mnt-green inline-flex items-center gap-1.5 text-[13px] font-semibold">
            <Check className="size-4" strokeWidth={2.4} /> Saved
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
      <div>
        <h2 className={sectionTitle}>Weekly schedule</h2>
        <p className={sectionSub}>
          Recurring blocks when you&apos;re usually free. Times are in your
          timezone.
        </p>
      </div>

      <div className={addBox}>
        <label className="flex flex-[2_1_160px] flex-col gap-1.5">
          <span className={label}>Day</span>
          <select
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
            className={field + " w-full"}
          >
            {DAY_ORDER.map((i) => (
              <option key={i} value={i}>
                {WEEKDAYS[i]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-[1_1_110px] flex-col gap-1.5">
          <span className={label}>From</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={field + " w-full"}
          />
        </label>
        <label className="flex flex-[1_1_110px] flex-col gap-1.5">
          <span className={label}>To</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={field + " w-full"}
          />
        </label>
        <button
          type="button"
          className={btn}
          disabled={pending}
          onClick={() =>
            run(() => addAvailabilityBlock({ weekday, startTime, endTime }))
          }
        >
          <Plus className="size-4" strokeWidth={2.4} /> Add block
        </button>
      </div>

      {error && <p className={errBox}>{error}</p>}

      <div className="flex flex-col">
        {DAY_ORDER.map((i) => {
          const dayBlocks = blocks
            .filter((b) => b.weekday === i)
            .sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));
          return (
            <div
              key={i}
              className="border-mnt-line flex flex-wrap items-center gap-2.5 border-b py-3 last:border-b-0"
            >
              <span
                className={
                  "w-[110px] shrink-0 text-[14px] font-bold " +
                  (dayBlocks.length ? "text-mnt-ink" : "text-mnt-faint")
                }
              >
                {WEEKDAYS[i]}
              </span>
              <div className="flex flex-[1_1_260px] flex-wrap gap-2">
                {dayBlocks.length === 0 ? (
                  <span className="text-mnt-faint flex h-9 items-center text-[13px]">
                    Not available
                  </span>
                ) : (
                  dayBlocks.map((b) => (
                    <span
                      key={b.id}
                      className="bg-mnt-brand/10 text-mnt-brand inline-flex h-9 items-center gap-1 rounded-[10px] py-0 pr-1 pl-3 text-[13px] font-bold"
                    >
                      {b.startTime} – {b.endTime}
                      <button
                        type="button"
                        aria-label={`Remove ${WEEKDAYS[i]} ${b.startTime} to ${b.endTime}`}
                        className="text-mnt-faint hover:text-mnt-ink grid size-7 place-items-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                        disabled={pending}
                        onClick={() => run(() => removeAvailabilityBlock(b.id))}
                      >
                        <X className="size-3.5" strokeWidth={2.4} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
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

  function fmtDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  return (
    <div className={card}>
      <div>
        <h2 className={sectionTitle}>Date exceptions</h2>
        <p className={sectionSub}>
          Override a specific date. Block time off (leave times empty to block
          the whole day) or add extra availability.
        </p>
      </div>

      <div className={addBox}>
        <label className="flex flex-[1_1_150px] flex-col gap-1.5">
          <span className={label}>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={field + " w-full"}
          />
        </label>
        <label className="flex flex-[1_1_180px] flex-col gap-1.5">
          <span className={label}>Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "available" | "blocked")}
            className={field + " w-full"}
          >
            <option value="blocked">Block time off</option>
            <option value="available">Extra availability</option>
          </select>
        </label>
        <label className="flex flex-[1_1_100px] flex-col gap-1.5">
          <span className={label}>From {needsTimes ? "" : "(optional)"}</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={field + " w-full"}
          />
        </label>
        <label className="flex flex-[1_1_100px] flex-col gap-1.5">
          <span className={label}>To {needsTimes ? "" : "(optional)"}</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={field + " w-full"}
          />
        </label>
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
          <Plus className="size-4" strokeWidth={2.4} /> Add
        </button>
      </div>

      {error && <p className={errBox}>{error}</p>}

      {exceptions.length === 0 ? (
        <div className="border-mnt-line text-mnt-ink-muted flex items-center gap-2.5 rounded-[14px] border border-dashed p-4 text-[13px]">
          <CalendarPlus className="text-mnt-faint size-[18px] shrink-0" />
          No date exceptions. Your weekly schedule applies every week.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {exceptions.map((e) => {
            const blocked = e.kind === "blocked";
            const span =
              e.startTime && e.endTime
                ? `${e.startTime} – ${e.endTime}`
                : "Whole day";
            return (
              <div
                key={e.id}
                className="border-mnt-line flex items-center gap-3 rounded-xl border p-2.5 px-3"
              >
                <span
                  className={
                    "grid size-9 shrink-0 place-items-center rounded-[10px] " +
                    (blocked
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-mnt-green/12 text-mnt-green")
                  }
                >
                  {blocked ? (
                    <CalendarOff className="size-4" strokeWidth={2} />
                  ) : (
                    <CalendarPlus className="size-4" strokeWidth={2} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-mnt-ink text-[14px] font-bold">
                    {fmtDate(e.date)}
                  </div>
                  <div className="text-mnt-ink-muted text-[12px]">
                    {blocked ? "Time off" : "Extra availability"} · {span}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove exception on ${e.date}`}
                  className="text-mnt-faint grid size-9 place-items-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                  disabled={pending}
                  onClick={() => run(() => removeAvailabilityException(e.id))}
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
