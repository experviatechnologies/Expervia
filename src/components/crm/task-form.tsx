"use client";

/**
 * Add a task. On a contact or company record the link is fixed; on the Tasks
 * page staff can search for a contact or company to link (optional).
 */
import { useEffect, useState, useTransition } from "react";
import { Building2, Loader2, User, X } from "lucide-react";
import { TASK_PRIORITY_LABEL, TASK_TYPE_LABEL } from "@/lib/crm/labels";
import type { Owner } from "@/lib/crm/record";
import type { TaskPriority, TaskType } from "@/lib/crm/tasks";
import { createTask, searchRelated } from "@/app/crm/tasks/actions";

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-500";

type Related = { kind: "contact" | "company"; id: string; label: string };

export function TaskForm({
  owners,
  meId,
  fixed,
  onDone,
}: {
  owners: Owner[];
  meId: string;
  /** Set on a contact or company record. */
  fixed?: Related;
  onDone?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("call");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState(meId);
  const [notes, setNotes] = useState("");
  const [related, setRelated] = useState<Related | null>(fixed ?? null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<(Related & { detail: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  // Suggestions only while searching with nothing linked yet.
  const searching = !fixed && !related && search.trim().length >= 2;
  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await searchRelated(search);
      if (!cancelled) setResults(r);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, searching]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await createTask({
        title,
        notes,
        type,
        priority,
        dueAt: due ? new Date(due).toISOString() : null,
        assigneeId: assignee,
        contactId: related?.kind === "contact" ? related.id : null,
        companyId: related?.kind === "company" ? related.id : null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTitle("");
      setNotes("");
      setDue("");
      if (!fixed) {
        setRelated(null);
        setSearch("");
      }
      setSaved(true);
      onDone?.();
    });
  }

  const meFirst = [
    ...owners.filter((o) => o.id === meId),
    ...owners.filter((o) => o.id !== meId),
  ];
  const id = (k: string) => `task-${fixed?.id ?? "new"}-${k}`;

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Add a task">
      <div>
        <label htmlFor={id("title")} className={labelClass}>
          What needs doing?
        </label>
        <input
          id={id("title")}
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Call to confirm the interview date"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={id("type")} className={labelClass}>
            Type
          </label>
          <select
            id={id("type")}
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className={fieldClass}
          >
            {Object.entries(TASK_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("priority")} className={labelClass}>
            Priority
          </label>
          <select
            id={id("priority")}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={fieldClass}
          >
            {Object.entries(TASK_PRIORITY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("due")} className={labelClass}>
            Due (optional)
          </label>
          <input
            id={id("due")}
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={id("assignee")} className={labelClass}>
            For
          </label>
          <select
            id={id("assignee")}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className={fieldClass}
          >
            {meFirst.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id === meId ? `${o.name} (you)` : o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!fixed && (
        <div className="relative">
          <label htmlFor={id("related")} className={labelClass}>
            About (optional)
          </label>
          {related ? (
            <p className="border-brand-200 bg-brand-50 flex h-10 items-center justify-between rounded-lg border px-3 text-sm">
              <span className="text-brand-800 inline-flex items-center gap-2 font-semibold">
                {related.kind === "contact" ? (
                  <User aria-hidden className="size-4" />
                ) : (
                  <Building2 aria-hidden className="size-4" />
                )}
                {related.label}
              </span>
              <button
                type="button"
                onClick={() => setRelated(null)}
                aria-label="Remove link"
                className="text-brand-600 hover:bg-brand-100 rounded p-1"
              >
                <X aria-hidden className="size-4" />
              </button>
            </p>
          ) : (
            <>
              <input
                id={id("related")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a contact or company"
                autoComplete="off"
                aria-controls={id("results")}
                className={fieldClass}
              />
              {searching && results.length > 0 && (
                <ul
                  id={id("results")}
                  className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#ece9f5] bg-white shadow-lg"
                >
                  {results.map((r) => (
                    <li key={`${r.kind}-${r.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setRelated(r);
                          setResults([]);
                        }}
                        className="hover:bg-brand-50 flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                      >
                        <span className="text-ink truncate font-medium">
                          {r.label}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">
                          {r.detail}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <div>
        <label htmlFor={id("notes")} className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id={id("notes")}
          rows={2}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${fieldClass} h-auto resize-y py-2`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          Add task
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {error ? (
            <span className="text-rose-700">{error}</span>
          ) : saved ? (
            <span className="font-semibold text-emerald-700">Task added</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
