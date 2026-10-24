"use client";

import { useState, useTransition } from "react";
import { Check, CalendarClock, Clock, Activity } from "lucide-react";
import { updateMentorshipSettings } from "./actions";

function noticeLabel(min: number): string {
  if (min >= 60 && min % 60 === 0) {
    const h = min / 60;
    return `${h} ${h === 1 ? "hour" : "hours"}`;
  }
  return `${min} min`;
}

function NumberField({
  label,
  hint,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-eten-ink text-[13px] font-semibold">{label}</span>
      <span className="border-eten-line bg-eten-panel-hi focus-within:border-eten-accent focus-within:ring-eten-accent/15 flex h-12 items-center rounded-xl border px-3.5 transition-all focus-within:ring-[3px]">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-[16px] font-bold outline-none"
        />
        <span className="text-eten-faint text-[13px] font-semibold">min</span>
      </span>
      <span className="text-eten-faint text-xs">{hint}</span>
    </label>
  );
}

export function SettingsForm({
  initial,
}: {
  initial: {
    defaultSessionMinutes: number;
    minNoticeMinutes: number;
    bufferMinutes: number;
  };
}) {
  const [duration, setDuration] = useState(initial.defaultSessionMinutes);
  const [notice, setNotice] = useState(initial.minNoticeMinutes);
  const [buffer, setBuffer] = useState(initial.bufferMinutes);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    duration !== initial.defaultSessionMinutes ||
    notice !== initial.minNoticeMinutes ||
    buffer !== initial.bufferMinutes;

  function edit(setter: (v: number) => void) {
    return (v: number) => {
      setter(v);
      setSaved(false);
    };
  }

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateMentorshipSettings({
        defaultSessionMinutes: duration,
        minNoticeMinutes: notice,
        bufferMinutes: buffer,
      });
      if ("error" in res) setError(res.error);
      else setSaved(true);
    });
  }

  function reset() {
    setDuration(initial.defaultSessionMinutes);
    setNotice(initial.minNoticeMinutes);
    setBuffer(initial.bufferMinutes);
    setSaved(false);
    setError(null);
  }

  const session = Math.max(0, duration || 0);
  const buf = Math.max(0, buffer || 0);

  return (
    <div className="flex flex-wrap gap-7">
      {/* Controls */}
      <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-5">
        <div className="flex items-start gap-3.5">
          <span className="bg-eten-accent-soft text-eten-accent grid size-11 shrink-0 place-items-center rounded-xl">
            <CalendarClock className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-eten-ink text-[17px] font-bold">
              Scheduling defaults
            </h2>
            <p className="text-eten-ink-muted mt-1 text-[13px] leading-relaxed">
              Used to fill in a mentor&apos;s availability editor the first time
              they open it. Changing these does not affect mentors who have
              already set their own.
            </p>
          </div>
        </div>

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-4">
          <NumberField
            label="Default session length"
            hint="How long each booking lasts"
            value={duration}
            min={10}
            step={5}
            onChange={edit(setDuration)}
          />
          <NumberField
            label="Minimum notice"
            hint="How far ahead mentees must book"
            value={notice}
            min={0}
            step={15}
            onChange={edit(setNotice)}
          />
          <NumberField
            label="Buffer between sessions"
            hint="Break kept free after each session"
            value={buffer}
            min={0}
            step={5}
            onChange={edit(setBuffer)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-eten-accent h-11 rounded-xl px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save defaults"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!dirty || pending}
            className="border-eten-line text-eten-ink-muted hover:bg-eten-hover h-11 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          {saved && (
            <span
              role="status"
              className="text-eten-verified inline-flex items-center gap-1.5 text-[13px] font-semibold"
            >
              <Check className="size-4" strokeWidth={2.2} />
              Defaults saved
            </span>
          )}
          {dirty && !saved && (
            <span className="text-[13px] font-medium text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          {error && (
            <span className="text-destructive text-[13px]">{error}</span>
          )}
        </div>
      </div>

      {/* Slot preview */}
      <div className="bg-eten-panel-hi flex min-w-0 flex-[2_1_300px] flex-col gap-4 rounded-2xl p-5">
        <div className="text-eten-faint font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
          How a slot looks
        </div>
        <div className="flex h-14 gap-1">
          <div
            className="bg-eten-accent flex min-w-0 flex-col justify-center overflow-hidden rounded-[10px] px-3 whitespace-nowrap text-white"
            style={{ flex: `${Math.max(session, 1)} 1 0` }}
          >
            <span className="text-[12px] font-semibold opacity-85">
              Session
            </span>
            <span className="text-[15px] font-extrabold">{session} min</span>
          </div>
          <div
            className="text-eten-ink-muted flex min-w-[34px] items-center justify-center rounded-[10px] text-[11px] font-bold"
            style={{
              flex: `${Math.max(buf, 4)} 1 0`,
              background:
                "repeating-linear-gradient(135deg, var(--color-eten-accent-soft) 0 6px, var(--color-eten-panel) 6px 12px)",
            }}
          >
            {buf}m
          </div>
          <div
            className="bg-eten-accent flex min-w-0 flex-col justify-center overflow-hidden rounded-[10px] px-3 whitespace-nowrap text-white"
            style={{ flex: `${Math.max(session, 1)} 1 0` }}
          >
            <span className="text-[12px] font-semibold opacity-85">Next</span>
          </div>
        </div>
        <div className="text-eten-ink-muted flex flex-col gap-2.5 text-[13px]">
          <div className="flex items-center gap-2.5">
            <Clock className="text-eten-accent size-4 shrink-0" />
            <span>
              Bookable from{" "}
              <b className="text-eten-ink">{noticeLabel(notice)}</b> ahead
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Activity className="text-eten-accent size-4 shrink-0" />
            <span>
              Each slot uses{" "}
              <b className="text-eten-ink">{session + buf} min</b> of a
              mentor&apos;s time
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
