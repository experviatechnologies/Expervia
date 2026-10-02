"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateMentorshipSettings } from "./actions";

const inputClass =
  "border-eten-line bg-eten-panel text-eten-ink focus:border-eten-accent mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none";
const labelClass = "text-eten-ink-muted text-xs font-medium";

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

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="dur">
            Default session length (min)
          </label>
          <input
            id="dur"
            type="number"
            min={10}
            max={240}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="notice">
            Minimum notice (min)
          </label>
          <input
            id="notice"
            type="number"
            min={0}
            value={notice}
            onChange={(e) => setNotice(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="buf">
            Buffer between sessions (min)
          </label>
          <input
            id="buf"
            type="number"
            min={0}
            max={240}
            value={buffer}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-eten-accent inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save defaults"}
        </button>
        {saved && (
          <span className="text-eten-verified inline-flex items-center gap-1 text-sm">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
