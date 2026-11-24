"use client";

/**
 * Search box and dropdown filters for the contacts list. Everything lives in
 * the URL (shareable, back button works); changing a filter goes back to
 * page 1. Search waits for a short pause in typing before it runs.
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { ACCOUNT_LABEL, SORT_LABEL } from "@/lib/crm/labels";

const selectClass =
  "h-10 rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-3 focus:ring-brand-100";

export function ContactFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  // Debounced search.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-sm">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone"
          aria-label="Search contacts"
          className="text-ink focus:border-brand-400 focus:ring-brand-100 h-10 w-full rounded-lg border border-[#e4e0f0] bg-white pr-9 pl-9 text-sm transition outline-none placeholder:text-slate-400 focus:ring-3"
        />
        {pending ? (
          <Loader2
            aria-label="Loading"
            className="text-brand-500 absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
          />
        ) : (
          q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="hover:text-ink absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400"
            >
              <X aria-hidden className="size-4" />
            </button>
          )
        )}
      </div>
      <div className="flex gap-3">
        <select
          aria-label="Account status"
          value={params.get("account") ?? "any"}
          onChange={(e) =>
            update({
              account: e.target.value === "any" ? null : e.target.value,
            })
          }
          className={selectClass}
        >
          {Object.entries(ACCOUNT_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={params.get("sort") ?? "newest"}
          onChange={(e) =>
            update({
              sort: e.target.value === "newest" ? null : e.target.value,
            })
          }
          className={selectClass}
        >
          {Object.entries(SORT_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
