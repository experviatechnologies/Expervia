"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Info,
  RefreshCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { createCircle } from "../actions";

type Cadence = "weekly" | "biweekly";

const CADENCES: { id: Cadence; label: string; hint: string }[] = [
  { id: "weekly", label: "Weekly", hint: "Every week" },
  { id: "biweekly", label: "Fortnightly", hint: "Every 2 weeks" },
];

const fieldBox =
  "border-mnt-line bg-mnt-panel-2 focus-within:border-mnt-brand flex h-[50px] items-center rounded-xl border px-3.5 transition-colors";
const fieldInput =
  "text-mnt-ink min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none";
const fieldLabel = "text-mnt-ink text-[14px] font-semibold";

function fmtDate(v: string): string {
  if (!v) return "";
  const d = new Date(v + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker?.();
  } catch {
    /* showPicker throws in some browsers; the field still works. */
  }
}

export function CreateCircleForm({ areaLabel }: { areaLabel: string }) {
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewTitle = title.trim() || "Untitled Circle";
  const cadenceLabel =
    CADENCES.find((c) => c.id === cadence)?.label ?? "Weekly";
  const dateRange =
    start && end
      ? `${fmtDate(start)} to ${fmtDate(end)}`
      : start
        ? `Starts ${fmtDate(start)}`
        : "Dates not set";

  function create() {
    setError(null);
    if (!title.trim()) {
      setError("Give your Circle a title.");
      return;
    }
    if (start && end && end < start) {
      setError("The end date must be after the start date.");
      return;
    }
    startTransition(async () => {
      const res = await createCircle({
        title: title.trim(),
        cadence,
        startDate: start,
        endDate: end,
      });
      if ("error" in res) setError(res.error);
      else setCreatedId(res.circleId);
    });
  }

  function again() {
    setTitle("");
    setCadence("weekly");
    setStart("");
    setEnd("");
    setError(null);
    setCreatedId(null);
  }

  const created = Boolean(createdId);

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6 px-6 py-9 md:px-8">
      <div>
        <Link
          href="/mentorship/mentor"
          className="text-mnt-ink-muted hover:text-mnt-ink mb-3.5 inline-flex items-center gap-1.5 text-[14px] font-semibold"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
        <h1 className="font-display text-mnt-ink text-[30px] font-extrabold tracking-[-0.02em]">
          Create a Circle
        </h1>
        <p className="text-mnt-ink-muted mt-1.5 text-[15px] leading-relaxed">
          Start a Circle in your capability area. You&apos;ll add mentees and
          set the schedule next.
        </p>
      </div>

      {/* Steps */}
      <ol className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold">
        {[
          { n: 1, label: "Circle details", active: true },
          { n: 2, label: "Add mentees", active: false },
          { n: 3, label: "Set the schedule", active: false },
        ].map((s) => (
          <li
            key={s.n}
            className={
              "flex items-center gap-2 " +
              (s.active ? "text-mnt-ink" : "text-mnt-faint")
            }
          >
            <span
              className={
                "grid size-6 place-items-center rounded-full text-[12px] font-extrabold " +
                (s.active
                  ? "bg-mnt-brand text-mnt-on-brand"
                  : "bg-mnt-panel-2 text-mnt-ink-muted")
              }
            >
              {s.n}
            </span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-start gap-5">
        {/* Form / success */}
        <section className="bg-mnt-panel border-mnt-line flex min-w-0 flex-[3_1_440px] flex-col gap-5 rounded-[18px] border p-7">
          {!created ? (
            <>
              <label className="flex flex-col gap-2">
                <span className={fieldLabel}>Title</span>
                <span className={fieldBox}>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Security Circle"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setError(null);
                    }}
                    className={fieldInput}
                  />
                </span>
                <span className="text-mnt-ink-muted text-[12px]">
                  A clear name helps mentees know what they&apos;re joining.
                </span>
              </label>

              <div className="flex flex-col gap-2">
                <span className={fieldLabel}>Capability area</span>
                <span className="bg-mnt-brand/10 text-mnt-brand inline-flex h-10 w-fit items-center gap-2 rounded-full px-3.5 text-[14px] font-bold">
                  <Sparkles className="size-4" /> {areaLabel}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className={fieldLabel}>Cadence</span>
                <div
                  role="radiogroup"
                  aria-label="Cadence"
                  className="grid [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))] gap-2"
                >
                  {CADENCES.map((c) => {
                    const on = cadence === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setCadence(c.id)}
                        className={
                          "flex min-h-[60px] flex-col items-start gap-0.5 rounded-xl px-3.5 py-2.5 text-left transition " +
                          (on
                            ? "border-mnt-brand bg-mnt-brand/[0.06] text-mnt-ink border-2"
                            : "border-mnt-line text-mnt-ink-muted hover:border-mnt-brand/40 border")
                        }
                      >
                        <span className="text-[14px] font-bold">{c.label}</span>
                        <span className="text-[12px] opacity-80">{c.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <label className="flex flex-col gap-2">
                  <span className={fieldLabel}>Start date</span>
                  <span className={fieldBox}>
                    <input
                      type="date"
                      value={start}
                      onClick={openPicker}
                      onChange={(e) => {
                        setStart(e.target.value);
                        setError(null);
                      }}
                      className={fieldInput + " cursor-pointer"}
                    />
                  </span>
                </label>
                <label className="flex flex-col gap-2">
                  <span className={fieldLabel}>End date</span>
                  <span className={fieldBox}>
                    <input
                      type="date"
                      value={end}
                      onClick={openPicker}
                      onChange={(e) => {
                        setEnd(e.target.value);
                        setError(null);
                      }}
                      className={fieldInput + " cursor-pointer"}
                    />
                  </span>
                </label>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-red-600 [background:rgba(239,68,68,0.1)] dark:text-red-400"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={create}
                  disabled={pending}
                  className="bg-mnt-brand text-mnt-on-brand h-[50px] flex-[1_1_200px] rounded-xl text-[15px] font-bold transition hover:brightness-110 disabled:opacity-60"
                >
                  {pending ? "Creating…" : "Create Circle"}
                </button>
                <Link
                  href="/mentorship/mentor"
                  className="border-mnt-line text-mnt-ink-muted hover:border-mnt-brand hover:text-mnt-ink flex h-[50px] items-center rounded-xl border px-5 text-[15px] font-semibold transition"
                >
                  Cancel
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
              <span className="bg-mnt-green/12 text-mnt-green grid size-[60px] place-items-center rounded-[18px]">
                <Check className="size-7" strokeWidth={2.4} />
              </span>
              <div className="text-mnt-ink text-[20px] font-extrabold">
                {previewTitle} is ready
              </div>
              <p className="text-mnt-ink-muted max-w-[380px] text-[14px] leading-relaxed">
                Next, add mentees to your Circle. You can also add mentees
                you&apos;ve accepted from your dashboard.
              </p>
              <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
                <Link
                  href={`/mentorship/circles/${createdId}`}
                  className="bg-mnt-brand text-mnt-on-brand inline-flex h-11 items-center rounded-xl px-5 text-[14px] font-bold"
                >
                  Add mentees
                </Link>
                <button
                  type="button"
                  onClick={again}
                  className="border-mnt-line text-mnt-ink-muted hover:border-mnt-brand hover:text-mnt-ink inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-[14px] font-semibold transition"
                >
                  <RefreshCcw className="size-4" /> Create another
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Live preview */}
        <aside className="flex min-w-0 flex-[2_1_280px] flex-col gap-3">
          <div className="text-mnt-ink-muted text-[12px] font-bold tracking-[0.08em] uppercase">
            Preview
          </div>
          <div className="bg-mnt-panel border-mnt-line flex flex-col gap-3.5 rounded-2xl border p-[18px]">
            <div className="flex items-center justify-between gap-2.5">
              <span className="bg-mnt-brand/10 text-mnt-brand grid size-10 place-items-center rounded-xl">
                <Users className="size-5" strokeWidth={1.8} />
              </span>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-[12px] font-bold " +
                  (created
                    ? "bg-mnt-green/12 text-mnt-green"
                    : "bg-mnt-panel-2 text-mnt-ink-muted")
                }
              >
                {created ? "Active" : "Draft"}
              </span>
            </div>
            <div>
              <div className="text-mnt-ink text-[16px] font-bold">
                {previewTitle}
              </div>
              <div className="text-mnt-ink-muted mt-0.5 text-[12px]">
                {areaLabel}
              </div>
            </div>
            <div className="border-mnt-line text-mnt-ink-muted flex flex-col gap-2 border-t pt-3 text-[13px]">
              <span className="flex items-center gap-2">
                <RefreshCcw className="text-mnt-brand size-[15px]" />
                Meets {cadenceLabel.toLowerCase()}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="text-mnt-brand size-[15px]" />
                {dateRange}
              </span>
              <span className="flex items-center gap-2">
                <Users className="text-mnt-brand size-[15px]" />
                No mentees yet
              </span>
            </div>
          </div>
          <div className="bg-mnt-panel-2 text-mnt-ink-muted flex items-start gap-2.5 rounded-2xl p-3.5 text-[13px] leading-relaxed">
            <Info className="text-mnt-brand mt-0.5 size-4 shrink-0" />
            Mentees can join a Circle that is already running, so you don&apos;t
            need everyone on day one.
          </div>
        </aside>
      </div>
    </div>
  );
}
