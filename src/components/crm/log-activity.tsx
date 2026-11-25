"use client";

/**
 * Log a note, call, meeting or email on a contact's or company's timeline. Calls and
 * meetings have an outcome. "When" defaults to now and can be set earlier,
 * for something that happened before it was written down.
 */
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVITY_LABEL } from "@/lib/crm/labels";
import type { LoggableType } from "@/lib/crm/record";
import { logActivity, type ActivityTarget } from "@/app/crm/activity-actions";

const TYPES: LoggableType[] = ["note", "call", "meeting", "email"];

const OUTCOMES: Partial<Record<LoggableType, string[]>> = {
  call: ["Connected", "Left voicemail", "No answer", "Busy", "Wrong number"],
  meeting: ["Completed", "Rescheduled", "No show", "Cancelled"],
};

const PLACEHOLDER: Record<LoggableType, string> = {
  note: "What should the team know about this person?",
  call: "What was discussed on the call?",
  meeting: "What was agreed in the meeting?",
  email: "Summarise the email you sent or received",
};

const fieldClass =
  "w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";

export function LogActivity({ target }: { target: ActivityTarget }) {
  const [type, setType] = useState<LoggableType>("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("");
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const outcomes = OUTCOMES[type];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await logActivity({
        target,
        type,
        subject,
        body,
        outcome: outcomes ? outcome : "",
        occurredAt: when ? new Date(when).toISOString() : undefined,
      });
      if (res.ok) {
        setSubject("");
        setBody("");
        setOutcome("");
        setWhen("");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Log activity">
      <div
        role="radiogroup"
        aria-label="What are you logging?"
        className="inline-flex rounded-lg border border-[#e4e0f0] bg-[#fbfaff] p-0.5"
      >
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => {
              setType(t);
              setOutcome("");
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              type === t
                ? "bg-brand-700 text-white"
                : "hover:text-ink text-slate-600",
            )}
          >
            {ACTIVITY_LABEL[t]}
          </button>
        ))}
      </div>

      {type !== "note" && (
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="Title (optional)"
          aria-label="Title"
          className={cn(fieldClass, "h-10")}
        />
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={3}
        required
        placeholder={PLACEHOLDER[type]}
        aria-label="Details"
        className={cn(fieldClass, "resize-y py-2")}
      />
      <div className="flex flex-wrap items-end gap-3">
        {outcomes && (
          <div>
            <label
              htmlFor="activity-outcome"
              className="mb-1 block text-xs font-semibold text-slate-500"
            >
              Outcome
            </label>
            <select
              id="activity-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className={cn(fieldClass, "h-10 w-auto")}
            >
              <option value="">Not set</option>
              {outcomes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label
            htmlFor="activity-when"
            className="mb-1 block text-xs font-semibold text-slate-500"
          >
            When
          </label>
          <input
            id="activity-when"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={cn(fieldClass, "h-10 w-auto")}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="bg-brand-700 hover:bg-brand-800 ml-auto inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          Log {ACTIVITY_LABEL[type].toLowerCase()}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
