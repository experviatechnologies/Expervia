"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, Search, Star, Users } from "lucide-react";
import { joinPod, leavePod } from "./actions";

export type PodCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  isPrimary: boolean;
};

type Tab = "all" | "joined" | "open";
type Sort = "name" | "members";

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

export function PodsDirectory({ pods }: { pods: PodCard[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const joinedCount = pods.filter((p) => p.isMember).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = pods
      .filter((p) =>
        tab === "all" ? true : tab === "joined" ? p.isMember : !p.isMember,
      )
      .filter(
        (p) =>
          !q || `${p.name} ${p.description ?? ""}`.toLowerCase().includes(q),
      );
    return [...list].sort((a, b) =>
      sort === "members"
        ? b.memberCount - a.memberCount
        : a.name.localeCompare(b.name),
    );
  }, [pods, query, tab, sort]);

  function toggle(pod: PodCard) {
    setError(null);
    setBusyId(pod.id);
    startTransition(async () => {
      const res = pod.isMember
        ? await leavePod({ podId: pod.id })
        : await joinPod({ podId: pod.id });
      if ("error" in res) setError(res.error);
      setBusyId(null);
    });
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: pods.length },
    { key: "joined", label: "Joined", count: joinedCount },
    { key: "open", label: "Not joined", count: pods.length - joinedCount },
  ];
  const SORTS: { key: Sort; label: string }[] = [
    { key: "name", label: "A to Z" },
    { key: "members", label: "Most members" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-eten-line bg-eten-panel text-eten-faint flex h-11 min-w-[260px] flex-1 items-center gap-2.5 rounded-xl border px-3.5">
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="sr-only">Search pods</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pods or topics"
            className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
          />
        </label>
        <div
          role="tablist"
          aria-label="Membership"
          className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
        >
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                className={
                  "inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-[13px] font-semibold transition-colors " +
                  (on
                    ? "bg-eten-panel text-eten-ink shadow-sm"
                    : "text-eten-ink-muted hover:text-eten-ink")
                }
              >
                {t.label}
                <span
                  className={
                    "rounded-full px-1.5 py-px text-[11px] font-bold " +
                    (on
                      ? "bg-eten-accent-soft text-eten-accent"
                      : "bg-eten-hover text-eten-ink-muted")
                  }
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        <div
          role="group"
          aria-label="Sort"
          className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
        >
          {SORTS.map((t) => {
            const on = sort === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => setSort(t.key)}
                className={
                  "rounded-[9px] px-3.5 py-2 text-[13px] font-semibold transition-colors " +
                  (on
                    ? "bg-eten-panel text-eten-ink shadow-sm"
                    : "text-eten-ink-muted hover:text-eten-ink")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="border-eten-line rounded-[18px] border border-dashed px-6 py-10 text-center">
          <div className="text-eten-ink text-[16px] font-bold">
            No pods match
          </div>
          <div className="text-eten-ink-muted mt-1 text-[13px]">
            Try another search or filter.
          </div>
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {shown.map((pod) => {
            const isBusy = pending && busyId === pod.id;
            return (
              <article
                key={pod.id}
                className={
                  "bg-eten-panel flex flex-col gap-4 rounded-[18px] border p-5 " +
                  (pod.isPrimary
                    ? "border-eten-accent/40 ring-eten-accent/15 ring-1"
                    : "border-eten-line hover:border-eten-accent/40 transition-colors")
                }
              >
                <div className="flex items-start gap-3.5">
                  <Link
                    href={`/pods/${pod.slug}`}
                    className="bg-eten-accent-soft text-eten-accent grid size-[46px] shrink-0 place-items-center rounded-[14px] text-[15px] font-extrabold"
                  >
                    {initials(pod.name)}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/pods/${pod.slug}`}
                        className="text-eten-ink text-[16px] font-bold hover:underline"
                      >
                        {pod.name}
                      </Link>
                      {pod.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <Star className="size-2.5 fill-current" />
                          Primary
                        </span>
                      )}
                    </div>
                    {pod.description && (
                      <p className="text-eten-ink-muted mt-1.5 text-[13px] leading-relaxed">
                        {pod.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-eten-line-soft mt-auto flex items-center justify-between gap-2.5 border-t pt-3.5">
                  <span className="text-eten-ink-muted inline-flex items-center gap-1.5 text-[13px]">
                    <Users className="size-4" strokeWidth={1.8} />
                    {pod.memberCount} members
                  </span>

                  {pod.isPrimary ? (
                    <span className="text-eten-verified inline-flex items-center gap-1.5 text-[13px] font-semibold">
                      <Check className="size-4" strokeWidth={2.4} />
                      Member
                    </span>
                  ) : pod.isMember ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold">
                        <Check className="size-3" strokeWidth={2.8} />
                        Joined
                      </span>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => toggle(pod)}
                        className="border-eten-line text-eten-ink-muted hover:bg-eten-hover h-10 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Leave"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggle(pod)}
                      className="bg-eten-accent h-10 rounded-xl px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Join"
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
