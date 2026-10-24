"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Star } from "lucide-react";

export type PodCard = {
  slug: string;
  name: string;
  mono: string;
  description: string | null;
  count: number;
  primary: number;
  pct: number;
};

type Sort = "members" | "primary" | "az";

const SORTS: { key: Sort; label: string }[] = [
  { key: "members", label: "Most members" },
  { key: "primary", label: "Most primary" },
  { key: "az", label: "A–Z" },
];

export function PodsBrowser({ pods }: { pods: PodCard[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("members");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = pods.filter(
      (p) => !q || p.slug.includes(q) || p.name.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) =>
      sort === "members"
        ? b.count - a.count
        : sort === "primary"
          ? b.primary - a.primary
          : a.name.localeCompare(b.name),
    );
  }, [pods, query, sort]);

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-eten-line bg-eten-panel text-eten-faint flex h-11 max-w-[420px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3.5">
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="sr-only">Search pods</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pods by name or tag"
            className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
          />
        </label>
        <div
          role="group"
          aria-label="Sort pods"
          className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
        >
          {SORTS.map((s) => {
            const on = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => setSort(s.key)}
                className={
                  "rounded-[9px] px-3.5 py-2 text-[13px] font-semibold transition-colors " +
                  (on
                    ? "bg-eten-panel text-eten-ink shadow-sm"
                    : "text-eten-ink-muted hover:text-eten-ink")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="text-eten-ink-muted ml-auto text-[13px]">
          Showing <b className="text-eten-ink">{shown.length}</b> of{" "}
          {pods.length} pods
        </div>
      </div>

      {/* Pod grid */}
      {shown.length === 0 ? (
        <div className="border-eten-line text-eten-ink-muted rounded-[18px] border border-dashed p-10 text-center text-sm">
          No pods match your search.
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          {shown.map((pod) => (
            <Link
              key={pod.slug}
              href={`/admin/pods/${pod.slug}`}
              className="group bg-eten-panel border-eten-line hover:border-eten-accent/40 flex flex-col gap-4 rounded-[18px] border p-[22px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(53,0,127,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="bg-eten-accent-soft text-eten-accent grid size-[46px] shrink-0 place-items-center rounded-[14px] text-[15px] font-extrabold">
                  {pod.mono}
                </span>
                <span className="bg-eten-panel-hi border-eten-line text-eten-ink-muted min-w-0 truncate rounded-lg border px-2.5 py-1 font-mono text-xs">
                  #{pod.slug}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <h3 className="text-eten-ink text-[17px] font-bold">
                  {pod.name}
                </h3>
                {pod.description && (
                  <p className="text-eten-ink-muted line-clamp-3 text-[13px] leading-relaxed">
                    {pod.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-baseline gap-1.5">
                    <b className="text-eten-ink text-[22px] font-extrabold">
                      {pod.count}
                    </b>
                    <span className="text-eten-ink-muted text-[13px]">
                      members
                    </span>
                  </span>
                  <span className="text-eten-accent flex items-center gap-1 text-[13px] font-semibold">
                    <Star className="size-3.5" />
                    {pod.primary} primary
                  </span>
                </div>
                <div
                  className="bg-eten-accent-soft h-1.5 overflow-hidden rounded-full"
                  title="Share of members with this as their primary pod"
                >
                  <span
                    className="bg-eten-accent block h-full rounded-full"
                    style={{ width: `${pod.pct}%` }}
                  />
                </div>
              </div>

              <div className="border-eten-line-soft flex items-center justify-between border-t pt-3.5 text-[13px]">
                <span className="text-eten-faint">{pod.pct}% primary</span>
                <span className="text-eten-accent flex items-center gap-1.5 font-bold">
                  View roster
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
