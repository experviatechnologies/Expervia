"use client";

/** Search and sort for the companies list, kept in the URL. */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { COMPANY_SORT_LABEL } from "@/lib/crm/labels";

export function CompanyFilters() {
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
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

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
          placeholder="Search company name or website"
          aria-label="Search companies"
          className="text-ink focus:border-brand-400 focus:ring-brand-100 h-10 w-full rounded-lg border border-[#e4e0f0] bg-white pr-9 pl-9 text-sm transition outline-none placeholder:text-slate-400 focus:ring-3"
        />
        {pending && (
          <Loader2
            aria-label="Loading"
            className="text-brand-500 absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
          />
        )}
      </div>
      <select
        aria-label="Sort"
        value={params.get("sort") ?? "name"}
        onChange={(e) =>
          update({ sort: e.target.value === "name" ? null : e.target.value })
        }
        className="text-ink focus:border-brand-400 focus:ring-brand-100 h-10 rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm transition outline-none focus:ring-3"
      >
        {Object.entries(COMPANY_SORT_LABEL).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
