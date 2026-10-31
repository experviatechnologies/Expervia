"use client";

/**
 * My availability (PRD FR-009..FR-013): recurring weekly windows with meeting
 * formats, date-specific exceptions that override the pattern, a "check a
 * date" preview, meeting preferences and the freshness review.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarPlus, Copy, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/tracker/store";
import {
  effectiveWindows,
  isFresh,
  weeklyMinutes,
} from "@/lib/tracker/availability";
import {
  CALENDAR_STATUS,
  EXCEPTION_KIND,
  EXCEPTION_REASON,
  FORMAT_LABEL,
} from "@/lib/tracker/labels";
import {
  DEFAULT_TZ,
  TIMEZONES,
  WEEKDAYS,
  fmtAgo,
  fmtCalendarDate,
  fmtDateTime,
  fromMinutes,
  toMinutes,
  zonedDate,
} from "@/lib/tracker/time";
import type {
  AvailabilityException,
  ExceptionKind,
  ExceptionReason,
  MeetingFormat,
  Weekday,
  WeeklyWindow,
} from "@/lib/tracker/types";
import {
  Btn,
  Card,
  ChipToggle,
  Dialog,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Pill,
  Toggle,
  inputClass,
  useToast,
} from "@/components/tracker/ui";
import { BASE } from "@/components/tracker/shell";

const FORMATS: MeetingFormat[] = ["online", "physical", "hybrid"];

let wseq = 0;
const newId = () => `w-new-${Date.now().toString(36)}-${++wseq}`;

/** Validation for one day's windows; returns a message per window id. */
function validateDay(windows: WeeklyWindow[]) {
  const errors: Record<string, string> = {};
  const sorted = [...windows]
    .filter((w) => w.active)
    .sort((a, b) => a.start.localeCompare(b.start));
  for (const w of windows) {
    if (!/^\d{2}:\d{2}$/.test(w.start) || !/^\d{2}:\d{2}$/.test(w.end))
      errors[w.id] = "Enter times as HH:mm.";
    else if (toMinutes(w.end) <= toMinutes(w.start))
      errors[w.id] = "End time must be after start time.";
    else if (w.formats.length === 0)
      errors[w.id] = "Choose at least one meeting format.";
  }
  for (let i = 1; i < sorted.length; i++) {
    if (
      toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end) &&
      !errors[sorted[i].id]
    )
      errors[sorted[i].id] =
        `Overlaps the ${sorted[i - 1].start}–${sorted[i - 1].end} window.`;
  }
  return errors;
}

export function AvailabilityView() {
  const t = useSession();
  const { me, data } = t;
  const toast = useToast();
  const [draft, setDraft] = useState<WeeklyWindow[]>(() =>
    structuredClone(me.weekly),
  );
  const [copyFrom, setCopyFrom] = useState<Weekday | null>(null);
  const [editing, setEditing] = useState<AvailabilityException | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(me.weekly);
  const errors = useMemo(() => {
    const all: Record<string, string> = {};
    for (const d of WEEKDAYS)
      Object.assign(all, validateDay(draft.filter((w) => w.day === d.day)));
    return all;
  }, [draft]);
  const valid = Object.keys(errors).length === 0;
  const fresh = isFresh(me, data.policies);
  const hours = Math.round(weeklyMinutes({ ...me, weekly: draft }) / 6) / 10;

  const patch = (id: string, p: Partial<WeeklyWindow>) =>
    setDraft((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w)));
  const addWindow = (day: Weekday) => {
    const last = draft
      .filter((w) => w.day === day)
      .sort((a, b) => b.end.localeCompare(a.end))[0];
    const start = last ? last.end : "09:00";
    const end = fromMinutes(
      Math.min(23 * 60 + 59, toMinutes(start) + (last ? 120 : 480)),
    );
    setDraft((ws) => [
      ...ws,
      { id: newId(), day, start, end, formats: [...me.formats], active: true },
    ]);
  };

  const today = zonedDate(t.now, me.timezone);
  const upcoming = me.exceptions.filter((e) => e.date >= today);

  return (
    <>
      <PageHeader
        title="My availability"
        description="Tell the Sales Manager and your Pod Leader when you can join client meetings. Specific-date exceptions always override your weekly pattern."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3.5 text-[14px]",
              fresh
                ? "border-eten-verified/25 bg-eten-verified-soft"
                : "border-trk-warn/30 bg-trk-warn-soft",
            )}
          >
            <p className="min-w-0 flex-1">
              {fresh ? (
                <>
                  Last reviewed {fmtAgo(me.reviewedAt!)} (
                  {fmtDateTime(me.reviewedAt!, me.timezone)}).
                </>
              ) : (
                <>
                  <strong>Your availability may be out of date.</strong>{" "}
                  {me.reviewedAt
                    ? `Last reviewed ${fmtAgo(me.reviewedAt)}.`
                    : "You have not reviewed it yet."}{" "}
                  Members are asked to review at least every{" "}
                  {data.policies.freshDays} days, and stale schedules are
                  flagged to the Sales Manager.
                </>
              )}
            </p>
            <Btn
              size="sm"
              onClick={() => {
                t.markReviewed();
                toast("Marked as reviewed.");
              }}
            >
              {fresh ? "Mark reviewed" : "It is up to date"}
            </Btn>
          </div>

          {me.calendar !== "connected" && (
            <Notice
              tone="warning"
              action={
                <Btn size="sm" href={`${BASE}/settings?tab=calendar`}>
                  Manage calendar
                </Btn>
              }
            >
              {me.calendar === "none"
                ? "Without a calendar, conflicts cannot be verified and you will be shown as 'declared availability only'."
                : "Your calendar authorisation has expired, so conflicts cannot be checked. Reconnect to restore verification."}
            </Notice>
          )}

          <Card
            title="Weekly availability"
            description={`Recurring times you can take client meetings, in your time zone (${me.timezone}). ${hours} hours a week.`}
            action={
              <div className="flex items-center gap-2">
                {dirty && <Pill tone="warning">Unsaved changes</Pill>}
                <Btn
                  variant="primary"
                  size="sm"
                  disabled={!dirty || !valid}
                  onClick={() => {
                    t.saveWeekly(draft);
                    toast("Weekly availability saved.");
                  }}
                >
                  <Save className="size-4" /> Save weekly pattern
                </Btn>
              </div>
            }
            bodyClassName=""
          >
            {WEEKDAYS.map(({ day, label }) => {
              const rows = draft.filter((w) => w.day === day);
              return (
                <div
                  key={day}
                  className="border-eten-line-soft grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[120px_1fr]"
                >
                  <div>
                    <p className="font-bold">{label}</p>
                    {rows.filter((w) => w.active).length === 0 && (
                      <Pill className="mt-1">Unavailable</Pill>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {rows.map((w) => (
                      <div
                        key={w.id}
                        className={cn(
                          "border-eten-line rounded-xl border p-3",
                          !w.active && "opacity-60",
                        )}
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          <Field label="From" className="w-[130px]">
                            {(id) => (
                              <input
                                id={id}
                                type="time"
                                value={w.start}
                                onChange={(e) =>
                                  patch(w.id, { start: e.target.value })
                                }
                                className={inputClass}
                              />
                            )}
                          </Field>
                          <Field label="Until" className="w-[130px]">
                            {(id) => (
                              <input
                                id={id}
                                type="time"
                                value={w.end}
                                onChange={(e) =>
                                  patch(w.id, { end: e.target.value })
                                }
                                className={inputClass}
                              />
                            )}
                          </Field>
                          <div>
                            <p className="mb-1.5 text-[13px] font-semibold">
                              Formats
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {FORMATS.map((f) => (
                                <ChipToggle
                                  key={f}
                                  on={w.formats.includes(f)}
                                  onClick={() =>
                                    patch(w.id, {
                                      formats: w.formats.includes(f)
                                        ? w.formats.filter((x) => x !== f)
                                        : [...w.formats, f],
                                    })
                                  }
                                >
                                  {FORMAT_LABEL[f]}
                                </ChipToggle>
                              ))}
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-3 pb-2">
                            <Toggle
                              checked={w.active}
                              onChange={(v) => patch(w.id, { active: v })}
                            >
                              Active
                            </Toggle>
                            <button
                              type="button"
                              aria-label={`Delete ${label} ${w.start}–${w.end} window`}
                              onClick={() =>
                                setDraft((ws) =>
                                  ws.filter((x) => x.id !== w.id),
                                )
                              }
                              className="text-eten-faint hover:text-trk-danger rounded-lg p-1"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                        {errors[w.id] && (
                          <p
                            className="text-trk-danger mt-2 text-[12.5px]"
                            role="alert"
                          >
                            {errors[w.id]}
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <Btn
                        size="sm"
                        variant="subtle"
                        onClick={() => addWindow(day)}
                      >
                        <Plus className="size-3.5" /> Add time window
                      </Btn>
                      {rows.length > 0 && (
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => setCopyFrom(day)}
                        >
                          <Copy className="size-3.5" /> Copy to other days
                        </Btn>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <WeekPreview windows={draft} />
          </Card>

          <Card
            title="Specific-date exceptions"
            description="Leave, travel, client work or extra hours on particular dates. These override your weekly pattern for that date."
            action={
              <Btn
                size="sm"
                onClick={() =>
                  setEditing({
                    id: "",
                    date: today,
                    kind: "unavailable_all",
                    reason: "leave",
                  })
                }
              >
                <CalendarPlus className="size-4" /> Add exception
              </Btn>
            }
            bodyClassName=""
          >
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming exceptions">
                Your weekly pattern applies on every date. Add an exception for
                leave, travel or extra availability.
              </EmptyState>
            ) : (
              <ul>
                {upcoming.map((e) => {
                  const normal = effectiveWindows(
                    { ...me, exceptions: [] },
                    e.date,
                  );
                  const actual = effectiveWindows(me, e.date);
                  const show = (ws: { start: number; end: number }[]) =>
                    ws.length
                      ? ws
                          .map(
                            (w) =>
                              `${fromMinutes(w.start)}–${fromMinutes(w.end)}`,
                          )
                          .join(", ")
                      : "Unavailable";
                  const k = EXCEPTION_KIND[e.kind];
                  return (
                    <li
                      key={e.id}
                      className="border-eten-line-soft border-b px-5 py-4 last:border-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-bold">{fmtCalendarDate(e.date)}</p>
                        <p className="text-eten-faint text-[12.5px]">
                          Normally {show(normal)} → this day{" "}
                          <strong className="text-eten-ink">
                            {show(actual)}
                          </strong>
                        </p>
                      </div>
                      <div className="bg-eten-canvas mt-2 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[13.5px]">
                        <Pill tone={k.tone}>{k.label}</Pill>
                        {e.kind !== "unavailable_all" && (
                          <span className="font-semibold">
                            {e.start}–{e.end}
                          </span>
                        )}
                        <span className="text-eten-ink-muted">
                          {EXCEPTION_REASON[e.reason]}
                          {e.note && ` · ${e.note}`}
                        </span>
                        <span className="ml-auto flex gap-1">
                          <button
                            type="button"
                            aria-label={`Edit exception on ${fmtCalendarDate(e.date)}`}
                            onClick={() => setEditing(e)}
                            className="text-eten-faint hover:text-eten-ink rounded p-1"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete exception on ${fmtCalendarDate(e.date)}`}
                            onClick={() => {
                              if (confirm("Delete this exception?")) {
                                t.deleteException(e.id);
                                toast("Exception deleted.");
                              }
                            }}
                            className="text-eten-faint hover:text-trk-danger rounded p-1"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <CheckDate />
          <Preferences />
          <Card title="Calendar connection">
            <Pill tone={CALENDAR_STATUS[me.calendar].tone}>
              {CALENDAR_STATUS[me.calendar].label}
            </Pill>
            <p className="text-eten-ink-muted mt-2 text-[13.5px]">
              We check your calendar&apos;s free/busy times before you are
              selected and add confirmed meetings to it. Event details stay
              private.
            </p>
            <Link
              href={`${BASE}/settings?tab=calendar`}
              className="text-eten-accent mt-2 inline-block text-[13.5px] font-semibold underline"
            >
              Manage calendar
            </Link>
          </Card>
        </div>
      </div>

      <CopyDialog
        from={copyFrom}
        onClose={() => setCopyFrom(null)}
        onCopy={(days) => {
          const source = draft.filter((w) => w.day === copyFrom);
          setDraft((ws) => [
            ...ws.filter((w) => !days.includes(w.day)),
            ...days.flatMap((d) =>
              source.map((w) => ({ ...w, id: newId(), day: d })),
            ),
          ]);
          setCopyFrom(null);
        }}
      />
      <ExceptionDialog value={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function WeekPreview({ windows }: { windows: WeeklyWindow[] }) {
  const from = 6 * 60;
  const to = 22 * 60;
  const span = to - from;
  return (
    <div className="border-eten-line border-t px-5 py-4">
      <p className="mb-2 text-[13px] font-bold">Preview</p>
      <div className="space-y-1.5" aria-hidden>
        {WEEKDAYS.map(({ day, short }) => (
          <div
            key={day}
            className="grid grid-cols-[36px_1fr] items-center gap-2"
          >
            <span className="text-eten-faint text-[12px]">{short}</span>
            <div className="bg-eten-line-soft relative h-4 rounded">
              {windows
                .filter(
                  (w) =>
                    w.day === day &&
                    w.active &&
                    toMinutes(w.end) > toMinutes(w.start),
                )
                .map((w) => {
                  const s = Math.max(from, toMinutes(w.start));
                  const e = Math.min(to, toMinutes(w.end));
                  if (e <= s) return null;
                  return (
                    <span
                      key={w.id}
                      className="bg-eten-accent absolute inset-y-0 rounded"
                      style={{
                        left: `${((s - from) / span) * 100}%`,
                        width: `${((e - s) / span) * 100}%`,
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}
        <div className="text-eten-faint ml-[44px] flex justify-between text-[11px]">
          {["06:00", "10:00", "14:00", "18:00", "22:00"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </div>
      <p className="sr-only">The preview repeats the windows listed above.</p>
    </div>
  );
}

function CheckDate() {
  const { me } = useSession();
  const [date, setDate] = useState(() => zonedDate(Date.now(), me.timezone));
  const windows = date ? effectiveWindows(me, date) : [];
  const ex = me.exceptions.filter((e) => e.date === date);
  return (
    <Card
      title="Check a date"
      description="See what you have declared for any date after exceptions are applied."
    >
      <Field label="Date">
        {(id) => (
          <input
            id={id}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      {date && (
        <div className="bg-eten-canvas mt-3 rounded-xl px-3 py-2.5 text-[14px]">
          <p className="font-bold">{fmtCalendarDate(date)}</p>
          {windows.length === 0 ? (
            <p className="text-eten-ink-muted">Unavailable</p>
          ) : (
            <ul className="mt-0.5">
              {windows.map((w) => (
                <li key={w.start}>
                  {fromMinutes(w.start)}–{fromMinutes(w.end)}{" "}
                  <span className="text-eten-faint">
                    · {w.formats.map((f) => FORMAT_LABEL[f]).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {ex.length > 0 && (
            <p className="text-eten-faint mt-1 text-[12.5px]">
              Includes {ex.length} exception{ex.length > 1 ? "s" : ""} for this
              date.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function Preferences() {
  const t = useSession();
  const toast = useToast();
  const me = t.me;
  const [formats, setFormats] = useState(me.formats);
  const [cities, setCities] = useState(me.cities.join(", "));
  const [travel, setTravel] = useState(me.willingToTravel);
  const [notes, setNotes] = useState(me.travelNotes);
  const [tz, setTz] = useState(me.timezone || DEFAULT_TZ);
  return (
    <Card title="Meeting preferences">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (formats.length === 0)
            return toast("Choose at least one meeting format.");
          t.saveProfile({
            formats,
            cities: cities
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
            willingToTravel: travel,
            travelNotes: notes,
            timezone: tz,
          });
          toast("Preferences saved.");
        }}
      >
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">
            Meeting formats you take
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map((f) => (
              <ChipToggle
                key={f}
                on={formats.includes(f)}
                onClick={() =>
                  setFormats((x) =>
                    x.includes(f) ? x.filter((y) => y !== f) : [...x, f],
                  )
                }
              >
                {FORMAT_LABEL[f]}
              </ChipToggle>
            ))}
          </div>
        </div>
        <Field
          label="Cities for in-person meetings"
          hint="Separate with commas, for example: Lagos, Abuja"
        >
          {(id) => (
            <input
              id={id}
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Toggle checked={travel} onChange={setTravel}>
          Willing to travel to other cities
        </Toggle>
        <Field label="Travel limitations">
          {(id) => (
            <textarea
              id={id}
              rows={2}
              value={notes}
              placeholder="For example: needs two days' notice for flights"
              onChange={(e) => setNotes(e.target.value)}
              className={cn(inputClass, "h-auto py-2")}
            />
          )}
        </Field>
        <Field
          label="Your time zone"
          hint="Your weekly windows are interpreted in this zone."
        >
          {(id) => (
            <select
              id={id}
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className={inputClass}
            >
              {TIMEZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          )}
        </Field>
        <Btn type="submit" className="w-full">
          Save preferences
        </Btn>
      </form>
    </Card>
  );
}

function CopyDialog({
  from,
  onClose,
  onCopy,
}: {
  from: Weekday | null;
  onClose: () => void;
  onCopy: (days: Weekday[]) => void;
}) {
  const [days, setDays] = useState<Weekday[]>([]);
  if (from === null) return null;
  const label = WEEKDAYS.find((d) => d.day === from)!.label;
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Copy ${label} to other days`}
      description="Existing windows on the chosen days will be replaced."
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={days.length === 0}
            onClick={() => {
              onCopy(days);
              setDays([]);
            }}
          >
            Copy windows
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {WEEKDAYS.filter((d) => d.day !== from).map((d) => (
          <Toggle
            key={d.day}
            checked={days.includes(d.day)}
            onChange={(v) =>
              setDays((x) => (v ? [...x, d.day] : x.filter((y) => y !== d.day)))
            }
          >
            {d.label}
          </Toggle>
        ))}
      </div>
    </Dialog>
  );
}

function ExceptionDialog({
  value,
  onClose,
}: {
  value: AvailabilityException | null;
  onClose: () => void;
}) {
  if (!value) return null;
  return (
    <ExceptionForm key={value.id || "new"} value={value} onClose={onClose} />
  );
}

function ExceptionForm({
  value,
  onClose,
}: {
  value: AvailabilityException;
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const [ex, setEx] = useState<AvailabilityException>({
    start: "09:00",
    end: "13:00",
    ...value,
  });
  const timed = ex.kind !== "unavailable_all";
  const error = !ex.date
    ? "Choose a date."
    : timed &&
        (!ex.start || !ex.end || toMinutes(ex.end) <= toMinutes(ex.start))
      ? "End time must be after start time."
      : "";
  const hints: Record<ExceptionKind, string> = {
    unavailable_all: "You will not be considered for any meeting on this date.",
    unavailable_part:
      "These hours are removed from your availability on this date, even if other exceptions add time.",
    extra: "These hours are added to your weekly windows on this date.",
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={
        value.id
          ? `Edit exception on ${fmtCalendarDate(value.date)}`
          : "Add an exception"
      }
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={Boolean(error)}
            onClick={() => {
              t.saveException(
                timed ? ex : { ...ex, start: undefined, end: undefined },
              );
              toast(value.id ? "Exception updated." : "Exception added.");
              onClose();
            }}
          >
            Save exception
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Date" required>
          {(id) => (
            <input
              id={id}
              type="date"
              value={ex.date}
              onChange={(e) => setEx({ ...ex, date: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Type" hint={hints[ex.kind]}>
          {(id) => (
            <select
              id={id}
              value={ex.kind}
              onChange={(e) =>
                setEx({ ...ex, kind: e.target.value as ExceptionKind })
              }
              className={inputClass}
            >
              {(Object.keys(EXCEPTION_KIND) as ExceptionKind[]).map((k) => (
                <option key={k} value={k}>
                  {EXCEPTION_KIND[k].label}
                </option>
              ))}
            </select>
          )}
        </Field>
        {timed && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              {(id) => (
                <input
                  id={id}
                  type="time"
                  value={ex.start}
                  onChange={(e) => setEx({ ...ex, start: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Until">
              {(id) => (
                <input
                  id={id}
                  type="time"
                  value={ex.end}
                  onChange={(e) => setEx({ ...ex, end: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
          </div>
        )}
        <Field label="Reason">
          {(id) => (
            <select
              id={id}
              value={ex.reason}
              onChange={(e) =>
                setEx({ ...ex, reason: e.target.value as ExceptionReason })
              }
              className={inputClass}
            >
              {(Object.keys(EXCEPTION_REASON) as ExceptionReason[]).map((k) => (
                <option key={k} value={k}>
                  {EXCEPTION_REASON[k]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          label="Note"
          hint="Optional. Visible to your Pod Leader and the Sales Manager."
        >
          {(id) => (
            <input
              id={id}
              value={ex.note ?? ""}
              onChange={(e) => setEx({ ...ex, note: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        {error && <p className="text-trk-danger text-[13px]">{error}</p>}
      </div>
    </Dialog>
  );
}
