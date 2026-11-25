"use client";

/** Search-and-pick a contact or a company to link to a record. */
import { useEffect, useState } from "react";
import { Building2, User, X } from "lucide-react";
import { searchRelated } from "@/app/crm/tasks/actions";

export type Picked = { id: string; label: string } | null;

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";

export function RelatedPicker({
  id,
  kind,
  label,
  value,
  onChange,
}: {
  id: string;
  kind: "contact" | "company";
  label: string;
  value: Picked;
  onChange: (v: Picked) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<
    { id: string; label: string; detail: string }[]
  >([]);
  const searching = !value && search.trim().length >= 2;

  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await searchRelated(search);
      if (!cancelled) setResults(r.filter((x) => x.kind === kind));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, searching, kind]);

  const Icon = kind === "contact" ? User : Building2;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold text-slate-500"
      >
        {label}
      </label>
      {value ? (
        <p className="border-brand-200 bg-brand-50 flex h-10 items-center justify-between rounded-lg border px-3 text-sm">
          <span className="text-brand-800 inline-flex min-w-0 items-center gap-2 font-semibold">
            <Icon aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{value.label}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setSearch("");
            }}
            aria-label={`Remove ${value.label}`}
            className="text-brand-600 hover:bg-brand-100 rounded p-1"
          >
            <X aria-hidden className="size-4" />
          </button>
        </p>
      ) : (
        <>
          <input
            id={id}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              kind === "contact" ? "Search a contact" : "Search a company"
            }
            autoComplete="off"
            className={fieldClass}
          />
          {searching && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#ece9f5] bg-white shadow-lg">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onChange({ id: r.id, label: r.label })}
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
  );
}
