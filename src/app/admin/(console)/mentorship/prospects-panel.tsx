"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type Prospect = {
  id: string;
  name: string;
  role: "mentor" | "mentee" | null;
  area: string;
  joined: string;
};

type RoleFilter = "all" | "mentor" | "mentee";

const FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mentor", label: "Mentors" },
  { key: "mentee", label: "Mentees" },
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

export function ProspectsPanel({ prospects }: { prospects: Prospect[] }) {
  const [role, setRole] = useState<RoleFilter>("all");

  const shown = useMemo(
    () => prospects.filter((p) => role === "all" || p.role === role),
    [prospects, role],
  );

  return (
    <section className="bg-eten-panel border-eten-line flex min-w-0 flex-1 basis-[520px] flex-col gap-4 rounded-[18px] border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-eten-ink flex items-center gap-2 text-[17px] font-bold">
            Prospects
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[13px] font-bold text-amber-600 dark:text-amber-400">
              {prospects.length}
            </span>
          </h2>
          <p className="text-eten-ink-muted mt-1 text-[13px]">
            Sign-ups waiting for validation
          </p>
        </div>
        <div
          role="group"
          aria-label="Filter prospects"
          className="bg-eten-panel-hi flex gap-1 rounded-xl p-1"
        >
          {FILTERS.map((f) => {
            const on = role === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setRole(f.key)}
                className={
                  "rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors " +
                  (on
                    ? "bg-eten-panel text-eten-ink shadow-sm"
                    : "text-eten-ink-muted hover:text-eten-ink")
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-eten-ink-muted py-8 text-center text-sm">
          No prospects in this view.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <Th>Name</Th>
                <Th>Registered as</Th>
                <Th>Capability area</Th>
                <Th className="text-right">Joined</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                >
                  <td className="py-2.5">
                    <Link
                      href={`/admin/members/${p.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <span className="bg-eten-accent-soft text-eten-accent grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold">
                        {initials(p.name)}
                      </span>
                      <span className="text-eten-ink font-semibold hover:underline">
                        {p.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    {p.role ? (
                      <span
                        className={
                          "inline-block rounded-full px-2.5 py-1 text-[12px] font-bold " +
                          (p.role === "mentor"
                            ? "bg-eten-accent-soft text-eten-accent"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400")
                        }
                      >
                        {p.role === "mentor" ? "Mentor" : "Mentee"}
                      </span>
                    ) : (
                      <span className="text-eten-faint">—</span>
                    )}
                  </td>
                  <td className="text-eten-ink-muted px-3 py-2.5">{p.area}</td>
                  <td className="text-eten-ink-muted py-2.5 text-right whitespace-nowrap tabular-nums">
                    {p.joined}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-eten-ink-muted text-[13px]">
        Showing <b className="text-eten-ink">{shown.length}</b> of{" "}
        {prospects.length}
      </div>
    </section>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "text-eten-ink-muted border-eten-line border-b py-2 pr-3 text-[12px] font-bold " +
        className
      }
    >
      {children}
    </th>
  );
}
