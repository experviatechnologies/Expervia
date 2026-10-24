"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export type PilotPod = {
  slug: string;
  name: string;
  count: number;
  names: string[]; // first few candidate names
  hasLeader: boolean;
  leaderName: string | null;
};

type Sort = "size" | "az";

const SORTS: { key: Sort; label: string }[] = [
  { key: "size", label: "Largest first" },
  { key: "az", label: "A–Z" },
];

const FACE_TINTS = [
  "bg-eten-accent-soft text-eten-accent",
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-eten-verified-soft text-eten-verified",
];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function PilotPods({
  pods,
  maxCount,
}: {
  pods: PilotPod[];
  maxCount: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("size");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = pods.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.names.some((n) => n.toLowerCase().includes(q)),
    );
    return [...filtered].sort((a, b) =>
      sort === "size" ? b.count - a.count : a.name.localeCompare(b.name),
    );
  }, [pods, query, sort]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-eten-ink text-[17px] font-bold">
            Candidate pilot mentees by pod
          </h2>
          <p className="text-eten-ink-muted mt-1 text-[13px]">
            Members can appear in more than one pod
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <label className="border-eten-line bg-eten-panel text-eten-faint flex h-11 w-[260px] max-w-full items-center gap-2.5 rounded-xl border px-3.5">
            <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
            <span className="sr-only">Search pods or names</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pods or names"
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
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="border-eten-line text-eten-ink-muted rounded-[18px] border border-dashed p-10 text-center text-sm">
          No pods or names match your search.
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {shown.map((pod) => {
            const faces = pod.names.slice(0, 4);
            const more = Math.max(0, pod.count - faces.length);
            return (
              <article
                key={pod.slug}
                className="bg-eten-panel border-eten-line hover:border-eten-accent/40 flex flex-col gap-3.5 rounded-[18px] border p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-eten-ink text-[16px] font-bold">
                    {pod.name}
                  </h3>
                  <span className="bg-eten-accent-soft text-eten-accent shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-extrabold tabular-nums">
                    {pod.count}
                  </span>
                </div>

                <div className="bg-eten-accent-soft h-1.5 overflow-hidden rounded-full">
                  <span
                    className="bg-eten-accent block h-full rounded-full"
                    style={{
                      width: `${maxCount > 0 ? (pod.count / maxCount) * 100 : 0}%`,
                    }}
                  />
                </div>

                {faces.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex" aria-hidden="true">
                      {faces.map((n, i) => (
                        <span
                          key={i}
                          className={
                            "border-eten-panel grid size-8 place-items-center rounded-full border-2 text-[11px] font-bold " +
                            FACE_TINTS[i % FACE_TINTS.length] +
                            (i ? " -ml-2" : "")
                          }
                        >
                          {initials(n)}
                        </span>
                      ))}
                      {more > 0 && (
                        <span className="bg-eten-panel-hi border-eten-panel text-eten-ink-muted -ml-2 grid size-8 place-items-center rounded-full border-2 text-[11px] font-bold">
                          +{more}
                        </span>
                      )}
                    </div>
                    <span className="text-eten-faint text-xs">candidates</span>
                  </div>
                )}

                <p className="text-eten-ink-muted flex-1 text-[13px] leading-relaxed">
                  {pod.count === 0 ? (
                    "No candidate mentees yet."
                  ) : (
                    <>
                      {faces.join(", ")}
                      {more > 0 && (
                        <span className="text-eten-faint">
                          {" "}
                          and {more} more
                        </span>
                      )}
                    </>
                  )}
                </p>

                <div className="border-eten-line-soft flex items-center justify-between gap-2.5 border-t pt-3.5">
                  {pod.hasLeader ? (
                    <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold">
                      <span className="bg-eten-verified size-1.5 rounded-full" />
                      {pod.leaderName ?? "Has leader"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[12px] font-bold text-amber-600 dark:text-amber-400">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      No leader
                    </span>
                  )}
                  <Link
                    href={`/admin/pods/${pod.slug}`}
                    className="text-eten-accent text-[13px] font-bold hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
