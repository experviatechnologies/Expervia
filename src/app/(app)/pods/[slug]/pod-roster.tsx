"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Search } from "lucide-react";
import { NominateMentorButton } from "./nominate-mentor-button";
import { PodRoleControl } from "./pod-role-control";

export type RosterItem = {
  memberId: string;
  name: string;
  headline: string | null;
  jobTitle: string | null;
  role: "member" | "lead" | "co_lead";
  visible: boolean;
  isMentor: boolean;
  nominationPending: boolean;
  canNominate: boolean;
};

const ROLE_LABEL = { lead: "Lead", co_lead: "Co-lead", member: "" } as const;

type Filter = "all" | "leads" | "members";

function initials(name: string): string {
  return (name ?? "?").trim().charAt(0).toUpperCase() || "?";
}

export function PodRoster({
  roster,
  podId,
  memberCount,
  isOps,
}: {
  roster: RosterItem[];
  podId: string;
  memberCount: number;
  isOps: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = {
    all: roster.length,
    leads: roster.filter((r) => r.role !== "member").length,
    members: roster.filter((r) => r.role === "member").length,
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster
      .filter((r) =>
        filter === "all"
          ? true
          : filter === "leads"
            ? r.role !== "member"
            : r.role === "member",
      )
      .filter(
        (r) =>
          !q ||
          `${r.name} ${r.headline ?? ""} ${r.jobTitle ?? ""}`
            .toLowerCase()
            .includes(q),
      );
  }, [roster, query, filter]);

  const ROLES: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Everyone", count: counts.all },
    { key: "leads", label: "Leads", count: counts.leads },
    { key: "members", label: "Members", count: counts.members },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="border-eten-line bg-eten-panel text-eten-faint flex h-11 min-w-[240px] flex-1 items-center gap-2.5 rounded-full border px-4">
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="sr-only">Search members</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members or skills"
            className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
          />
        </label>
        <div role="group" aria-label="Role" className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => {
            const on = filter === r.key;
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(r.key)}
                className={
                  "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors " +
                  (on
                    ? "border-eten-accent bg-eten-accent text-white"
                    : "border-eten-line text-eten-ink-muted hover:text-eten-ink")
                }
              >
                {r.label}
                <span
                  className={
                    "rounded-full px-1.5 py-px text-[11px] font-bold " +
                    (on ? "bg-white/20 text-white" : "bg-eten-hover")
                  }
                >
                  {r.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-eten-ink-muted text-[13px]">
        Showing <b className="text-eten-ink">{shown.length}</b> of {memberCount}{" "}
        members
      </p>

      {shown.length === 0 ? (
        <div className="border-eten-line rounded-[18px] border border-dashed px-6 py-10 text-center">
          <div className="text-eten-ink text-[16px] font-bold">
            No members match
          </div>
          <div className="text-eten-ink-muted mt-1 text-[13px]">
            Try another name or skill.
          </div>
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
          {shown.map((r) => {
            const nameEl = r.visible ? (
              <Link
                href={`/members/${r.memberId}`}
                className="text-eten-ink text-[15px] font-extrabold hover:underline"
              >
                {r.name}
              </Link>
            ) : (
              <span className="text-eten-ink text-[15px] font-extrabold">
                {r.name}
              </span>
            );
            return (
              <article
                key={r.memberId}
                className="bg-eten-panel border-eten-line flex flex-col overflow-hidden rounded-[16px] border"
              >
                <div
                  className="h-16"
                  style={{
                    background:
                      "linear-gradient(120deg, #35007F 0%, var(--color-eten-accent) 100%)",
                  }}
                />
                <div className="-mt-11 flex flex-1 flex-col items-center gap-1 px-4 pb-4 text-center">
                  <span className="border-eten-panel bg-eten-accent grid size-[72px] place-items-center rounded-full border-4 text-[22px] font-bold text-white shadow-[0_2px_8px_rgba(17,2,99,0.15)]">
                    {initials(r.name)}
                  </span>
                  <span className="mt-1">{nameEl}</span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {r.role !== "member" && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {ROLE_LABEL[r.role]}
                      </span>
                    )}
                    {r.isMentor && (
                      <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold">
                        <GraduationCap className="size-3" />
                        Mentor
                      </span>
                    )}
                  </div>
                  {(r.headline || r.jobTitle) && (
                    <p className="text-eten-ink-muted min-h-9 text-[12px] leading-relaxed">
                      {r.headline ?? r.jobTitle}
                    </p>
                  )}

                  <div className="mt-auto flex w-full flex-col items-center gap-2 pt-3">
                    {r.canNominate ? (
                      <NominateMentorButton
                        podId={podId}
                        memberId={r.memberId}
                      />
                    ) : r.nominationPending ? (
                      <span className="text-eten-faint text-[12px]">
                        Nomination pending
                      </span>
                    ) : r.visible ? (
                      <Link
                        href={`/members/${r.memberId}`}
                        className="border-eten-line text-eten-accent hover:bg-eten-hover inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition-colors"
                      >
                        View profile
                        <ArrowRight className="size-3.5" />
                      </Link>
                    ) : null}
                    {isOps && (
                      <PodRoleControl
                        podId={podId}
                        memberId={r.memberId}
                        role={r.role}
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
