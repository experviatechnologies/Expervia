"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid, Search } from "lucide-react";

export type CircleCard = {
  id: string;
  title: string | null;
  podName: string;
  status: string;
  role: "Mentor" | "Mentee";
  mentorName?: string;
};

type RoleFilter = "all" | "mentor" | "mentee";
type StatusFilter = "all" | "active" | "completed";

function initials(text: string): string {
  const words = text.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "C";
}

const STATUS_STYLE: Record<string, { cls: string; dot: string }> = {
  active: {
    cls: "bg-eten-verified-soft text-eten-verified",
    dot: "bg-eten-verified",
  },
  completed: {
    cls: "bg-eten-panel-hi text-eten-ink-muted",
    dot: "bg-eten-faint",
  },
  draft: { cls: "bg-eten-panel-hi text-eten-ink-muted", dot: "bg-eten-faint" },
};

export function CirclesBrowser({ circles }: { circles: CircleCard[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const byRole = useMemo(
    () =>
      circles.filter((c) =>
        role === "all" ? true : c.role.toLowerCase() === role,
      ),
    [circles, role],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return byRole
      .filter((c) =>
        status === "all" ? true : c.status.toLowerCase() === status,
      )
      .filter(
        (c) => !q || `${c.title ?? ""} ${c.podName}`.toLowerCase().includes(q),
      );
  }, [byRole, query, status]);

  const ROLES: { key: RoleFilter; label: string }[] = [
    { key: "all", label: "All roles" },
    { key: "mentor", label: "As mentor" },
    { key: "mentee", label: "As mentee" },
  ];
  const STATUSES: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: byRole.length },
    {
      key: "active",
      label: "Active",
      count: byRole.filter((c) => c.status.toLowerCase() === "active").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: byRole.filter((c) => c.status.toLowerCase() === "completed")
        .length,
    },
  ];

  const seg = (on: boolean) =>
    "rounded-[9px] px-3.5 py-2 text-[13px] font-semibold transition-colors " +
    (on
      ? "bg-eten-panel text-eten-ink shadow-sm"
      : "text-eten-ink-muted hover:text-eten-ink");

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="border-eten-line bg-eten-panel text-eten-faint flex h-11 min-w-[260px] flex-1 items-center gap-2.5 rounded-xl border px-3.5">
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="sr-only">Search circles</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search circles"
            className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
          />
        </label>
        <div
          role="tablist"
          aria-label="Role"
          className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
        >
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={role === r.key}
              onClick={() => setRole(r.key)}
              className={seg(role === r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div
          role="tablist"
          aria-label="Status"
          className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
        >
          {STATUSES.map((t) => {
            const on = status === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setStatus(t.key)}
                className={"inline-flex items-center gap-1.5 " + seg(on)}
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
      </div>

      {shown.length === 0 ? (
        <div className="border-eten-line flex flex-col items-center gap-2.5 rounded-[18px] border border-dashed px-6 py-10 text-center">
          <span className="bg-eten-accent-soft text-eten-accent grid size-13 place-items-center rounded-2xl">
            <LayoutGrid className="size-6" />
          </span>
          <div className="text-eten-ink text-[16px] font-bold">
            {role === "mentee"
              ? "No Circles as a mentee yet"
              : "No Circles match"}
          </div>
          <div className="text-eten-ink-muted text-[13px]">
            {role === "mentee"
              ? "When a mentor adds you to a Circle, it will show up here."
              : "Try another search or filter."}
          </div>
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {shown.map((c) => {
            const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.draft;
            return (
              <Link
                key={`${c.role}-${c.id}`}
                href={`/circles/${c.id}`}
                className="bg-eten-panel border-eten-line hover:border-eten-accent/40 flex flex-col gap-4 rounded-[18px] border p-5 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <span className="bg-eten-accent-soft text-eten-accent grid size-[46px] shrink-0 place-items-center rounded-[14px] text-[15px] font-extrabold">
                    {initials(c.title ?? c.podName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-eten-ink text-[16px] font-bold">
                      {c.title ?? `${c.podName} Circle`}
                    </div>
                    <div className="text-eten-ink-muted mt-0.5 inline-flex items-center gap-1.5 text-[13px]">
                      <LayoutGrid className="size-3.5" strokeWidth={1.8} />
                      {c.podName}
                      {c.role === "Mentee" && c.mentorName
                        ? ` · ${c.mentorName}`
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="border-eten-line-soft flex flex-wrap items-center justify-between gap-2.5 border-t pt-3.5">
                  <div className="flex gap-1.5">
                    <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2.5 py-1 text-[12px] font-bold">
                      {c.role}
                    </span>
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold capitalize " +
                        st.cls
                      }
                    >
                      <span className={"size-1.5 rounded-full " + st.dot} />
                      {c.status}
                    </span>
                  </div>
                  <span className="text-eten-accent inline-flex items-center gap-1 text-[13px] font-semibold">
                    Open <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
