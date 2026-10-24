"use client";

import { useMemo, useState } from "react";
import { Search, Globe } from "lucide-react";

export type MentorCapacity = {
  id: string;
  name: string;
  status: string;
  timezone: string;
  blocks: number;
  sessionLen: number;
  maxPerWeek: number | null;
  upcoming: number;
};

const STATUS: Record<string, { cls: string; dot: string; label: string }> = {
  accepting: {
    cls: "bg-eten-verified-soft text-eten-verified",
    dot: "bg-eten-verified",
    label: "Accepting",
  },
  limited: {
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Limited",
  },
  unavailable: {
    cls: "bg-eten-panel-hi text-eten-ink-muted",
    dot: "bg-eten-faint",
    label: "Unavailable",
  },
};

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

export function CapacityTable({ mentors }: { mentors: MentorCapacity[] }) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mentors.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.timezone.toLowerCase().includes(q),
    );
  }, [mentors, query]);

  return (
    <section className="bg-eten-panel border-eten-line flex min-w-0 flex-col rounded-[18px] border">
      <div className="border-eten-line flex flex-wrap items-center gap-3 border-b p-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-eten-ink text-[17px] font-bold">
            Mentor capacity
          </h2>
          <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2.5 py-0.5 text-[13px] font-bold">
            {mentors.length}
          </span>
        </div>
        <label className="border-eten-line bg-eten-panel-hi text-eten-faint ml-auto flex h-11 w-[300px] max-w-full items-center gap-2.5 rounded-xl border px-3.5">
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="sr-only">Search mentors</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mentors"
            className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="text-eten-ink-muted p-8 text-center text-sm">
          {mentors.length === 0
            ? "No mentors have set their availability yet."
            : "No mentors match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-eten-panel-hi text-left">
                <Th className="pl-6">Mentor</Th>
                <Th>Status</Th>
                <Th>Timezone</Th>
                <Th>Weekly blocks</Th>
                <Th>Session</Th>
                <Th>Max / week</Th>
                <Th className="pr-6 text-right">Upcoming</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => {
                const st = STATUS[m.status] ?? {
                  cls: "bg-eten-panel-hi text-eten-ink-muted",
                  dot: "bg-eten-faint",
                  label: m.status,
                };
                return (
                  <tr
                    key={m.id}
                    className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                  >
                    <td className="py-3 pr-3 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="bg-eten-accent-soft text-eten-accent grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold">
                          {initials(m.name)}
                        </span>
                        <span className="text-eten-ink font-semibold">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold " +
                          st.cls
                        }
                      >
                        <span className={"size-1.5 rounded-full " + st.dot} />
                        {st.label}
                      </span>
                    </td>
                    <td className="text-eten-ink-muted px-3 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe
                          className="text-eten-faint size-3.5"
                          strokeWidth={1.8}
                        />
                        {m.timezone}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex gap-[3px]" aria-hidden="true">
                          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <span
                              key={i}
                              className={
                                "h-4 w-2 rounded-[3px] " +
                                (i < m.blocks
                                  ? "bg-eten-accent"
                                  : "bg-eten-accent-soft")
                              }
                            />
                          ))}
                        </div>
                        <b className="text-eten-ink text-[13px]">{m.blocks}</b>
                      </div>
                    </td>
                    <td className="text-eten-ink-muted px-3 py-3">
                      {m.sessionLen} min
                    </td>
                    <td className="text-eten-ink-muted px-3 py-3">
                      {m.maxPerWeek ?? "—"}
                    </td>
                    <td className="text-eten-ink-muted py-3 pr-6 pl-3 text-right tabular-nums">
                      {m.upcoming}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-eten-ink-muted px-6 py-3.5 text-[13px]">
        Showing <b className="text-eten-ink">{shown.length}</b> of{" "}
        {mentors.length} mentors · weekly blocks shown out of 7
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
        "text-eten-ink-muted border-eten-line border-b px-3 py-3 text-[12px] font-bold " +
        className
      }
    >
      {children}
    </th>
  );
}
