"use client";

/**
 * Create a list, or edit one. Smart lists pick filters and show a live count
 * of who matches; fixed lists only need a name (people are added from their
 * contact record).
 */
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCOUNT_LABEL, LEAD_STATUS_LABEL, VIEW_LABEL } from "@/lib/crm/labels";
import type { Owner } from "@/lib/crm/record";
import { createList, previewCount, updateList } from "./actions";

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-500";

type Filters = Record<string, string>;

export function ListBuilder({
  options,
  listId,
  initial,
  onDone,
}: {
  options: { sources: string[]; tags: string[]; owners: Owner[] };
  /** Set when editing. */
  listId?: string;
  initial?: {
    name: string;
    description: string;
    kind: "smart" | "fixed";
    filters: Filters;
  };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kind, setKind] = useState<"smart" | "fixed">(initial?.kind ?? "smart");
  const [filters, setFilters] = useState<Filters>(initial?.filters ?? {});
  const [count, setCount] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const editing = Boolean(listId);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const v = e.target.value;
      setFilters((f) => {
        const next = { ...f };
        if (v) next[k] = v;
        else delete next[k];
        return next;
      });
    };

  // Live preview of who matches (debounced, smart lists only).
  const key = JSON.stringify(filters);
  useEffect(() => {
    if (kind !== "smart") return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const n = await previewCount(JSON.parse(key));
      if (!cancelled) setCount(n);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key, kind]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = editing
        ? await updateList(listId!, {
            name,
            description,
            filters: kind === "smart" ? filters : undefined,
          })
        : await createList({ name, description, kind, filters });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (editing) {
        onDone?.();
        router.refresh();
      } else {
        router.push(`/crm/lists/${res.id}`);
      }
    });
  }

  const select = (
    k: string,
    label: string,
    entries: [string, string][],
    anyLabel: string,
  ) => (
    <div>
      <label htmlFor={`lb-${k}`} className={labelClass}>
        {label}
      </label>
      <select
        id={`lb-${k}`}
        value={filters[k] ?? ""}
        onChange={set(k)}
        className={fieldClass}
      >
        <option value="">{anyLabel}</option>
        {entries.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lb-name" className={labelClass}>
            List name
          </label>
          <input
            id="lb-name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Facebook leads to call this week"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="lb-description" className={labelClass}>
            Description (optional)
          </label>
          <input
            id="lb-description"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {!editing && (
        <fieldset>
          <legend className={labelClass}>Type of list</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "smart",
                  "Smart list",
                  "Saved filters. People join and leave automatically as their details change.",
                ],
                [
                  "fixed",
                  "Fixed list",
                  "Hand-picked people. Add someone from their contact record.",
                ],
              ] as const
            ).map(([v, title, text]) => (
              <label
                key={v}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                  kind === v
                    ? "border-brand-400 bg-brand-50"
                    : "hover:border-brand-200 border-[#e4e0f0] bg-white",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={v}
                  checked={kind === v}
                  onChange={() => setKind(v)}
                  className="accent-brand-700 mt-1"
                />
                <span>
                  <span className="text-ink block text-sm font-semibold">
                    {title}
                  </span>
                  <span className="block text-xs text-slate-600">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {kind === "smart" && (
        <div className="rounded-xl border border-[#ece9f5] bg-[#fbfaff] p-4">
          <p className="text-ink mb-3 text-sm font-semibold">
            Who should be on this list?
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {select(
              "view",
              "Group",
              Object.entries(VIEW_LABEL).filter(([v]) => v !== "all"),
              "Everyone",
            )}
            {select(
              "account",
              "Account",
              Object.entries(ACCOUNT_LABEL).filter(([v]) => v !== "any"),
              "Any account status",
            )}
            {select(
              "leadStatus",
              "Lead status",
              Object.entries(LEAD_STATUS_LABEL),
              "Any lead status",
            )}
            {select(
              "source",
              "Source",
              options.sources.map((s) => [s, s]),
              "Any source",
            )}
            {select(
              "tag",
              "Tag",
              options.tags.map((t) => [t, t]),
              "Any tag",
            )}
            {select(
              "owner",
              "Owner",
              [
                ["none", "No owner"],
                ...options.owners.map((o): [string, string] => [o.id, o.name]),
              ],
              "Anyone",
            )}
            {select(
              "gender",
              "Gender",
              [
                ["female", "Women"],
                ["male", "Men"],
              ],
              "Anyone",
            )}
            <div className="sm:col-span-2">
              <label htmlFor="lb-q" className={labelClass}>
                Name, email or phone contains
              </label>
              <input
                id="lb-q"
                maxLength={100}
                value={filters.q ?? ""}
                onChange={set("q")}
                className={fieldClass}
              />
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700"
          >
            <Users aria-hidden className="text-brand-600 size-4" />
            {count === undefined ? (
              "Counting…"
            ) : count === null ? (
              "Couldn't count right now"
            ) : (
              <>
                <span className="text-ink font-semibold">
                  {count.toLocaleString("en-GB")}
                </span>{" "}
                {count === 1 ? "person matches" : "people match"} right now
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="bg-brand-700 hover:bg-brand-800 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {editing ? "Save list" : "Create list"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-ink hover:bg-brand-50 inline-flex h-10 items-center rounded-lg border border-[#e4e0f0] bg-white px-4 text-sm font-semibold"
          >
            Cancel
          </button>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
