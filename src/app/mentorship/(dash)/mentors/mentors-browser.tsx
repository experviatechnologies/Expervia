"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Briefcase, Check, Search, Star } from "lucide-react";
import { RequestControl } from "./request-control";

export type MentorCard = {
  id: string;
  name: string;
  headline: string | null;
  tier: string;
  areaLabel: string;
  ratingAvg: number;
  ratingCount: number;
  reqStatus: "pending" | "accepted" | "declined" | null;
};

const COVERS = [
  "linear-gradient(120deg, #35007F 0%, #7530E6 100%)",
  "linear-gradient(120deg, #0F3C78 0%, #2F6FD6 100%)",
  "linear-gradient(120deg, #0B4F4A 0%, #1A9A8C 100%)",
  "linear-gradient(120deg, #4A1259 0%, #A23BB8 100%)",
  "linear-gradient(120deg, #7A2E06 0%, #D9772B 100%)",
  "linear-gradient(120deg, #110263 0%, #4A16C4 100%)",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            "size-3.5 " +
            (n <= filled ? "fill-mnt-amber text-mnt-amber" : "text-mnt-faint")
          }
        />
      ))}
    </span>
  );
}

export function MentorsBrowser({
  mentors,
  isValidated,
}: {
  mentors: MentorCard[];
  isValidated: boolean;
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");

  const areaNames = useMemo(
    () => ["All", ...Array.from(new Set(mentors.map((m) => m.areaLabel)))],
    [mentors],
  );

  const matchQ = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (m: MentorCard) =>
      !q ||
      `${m.name} ${m.headline ?? ""} ${m.areaLabel}`.toLowerCase().includes(q);
  }, [query]);

  const cards = mentors.filter(
    (m) => (area === "All" || m.areaLabel === area) && matchQ(m),
  );
  const myMentor = mentors.find((m) => m.reqStatus === "accepted");
  const pendingCount = mentors.filter((m) => m.reqStatus === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Your mentor */}
      {myMentor && (
        <section className="bg-mnt-panel border-mnt-line flex flex-wrap items-center gap-4 rounded-[18px] border px-5 py-[18px]">
          <div className="relative size-16 shrink-0">
            <span className="bg-mnt-brand/14 text-mnt-brand grid size-16 place-items-center rounded-full text-[20px] font-extrabold">
              {initials(myMentor.name)}
            </span>
            <span className="border-mnt-panel bg-mnt-green absolute right-0 bottom-0 grid size-5 place-items-center rounded-full border-[3px]">
              <Check className="size-2.5 text-white" strokeWidth={4} />
            </span>
          </div>
          <div className="min-w-0 flex-[1_1_260px]">
            <div className="text-mnt-green text-[12px] font-bold tracking-[0.06em] uppercase">
              Mentoring you
            </div>
            <div className="text-mnt-ink text-[17px] font-extrabold">
              {myMentor.name}
            </div>
            {myMentor.headline && (
              <div className="text-mnt-ink-muted text-[13px]">
                {myMentor.headline}
              </div>
            )}
          </div>
          <Link
            href={`/mentorship/mentors/${myMentor.id}`}
            className="bg-mnt-brand text-mnt-on-brand inline-flex h-[42px] items-center rounded-full px-[18px] text-sm font-bold"
          >
            Book a session
          </Link>
        </section>
      )}

      {/* Search + area filter */}
      <div className="flex flex-col gap-3">
        <label className="border-mnt-line bg-mnt-panel text-mnt-faint flex h-[46px] max-w-[560px] items-center gap-2.5 rounded-full border px-4">
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="sr-only">Search mentors</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or skill, e.g. IAM, DevOps"
            className="text-mnt-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
          />
        </label>
        <div
          role="group"
          aria-label="Capability area"
          className="flex flex-wrap gap-2"
        >
          {areaNames.map((a) => {
            const on = area === a;
            const count = mentors.filter(
              (m) => (a === "All" || m.areaLabel === a) && matchQ(m),
            ).length;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={on}
                onClick={() => setArea(a)}
                className={
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors " +
                  (on
                    ? "border-mnt-brand bg-mnt-brand text-mnt-on-brand"
                    : "border-mnt-line text-mnt-ink-muted hover:text-mnt-ink")
                }
              >
                {a === "All" ? "All areas" : a}
                <span
                  className={
                    "rounded-full px-1.5 py-px text-[11px] font-bold " +
                    (on ? "bg-white/20 text-white" : "bg-mnt-panel-2")
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-mnt-ink-muted text-[13px]">
        {cards.length} verified mentor{cards.length === 1 ? "" : "s"}
        {pendingCount > 0
          ? ` · ${pendingCount} request${pendingCount === 1 ? "" : "s"} pending`
          : ""}
      </div>

      {cards.length === 0 ? (
        <div className="border-mnt-line rounded-[18px] border border-dashed px-6 py-10 text-center">
          <div className="text-mnt-ink text-[16px] font-bold">
            No mentors match
          </div>
          <div className="text-mnt-ink-muted mt-1 text-[13px]">
            Try another name, skill or capability area.
          </div>
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {cards.map((m, i) => (
            <article
              key={m.id}
              className="bg-mnt-panel border-mnt-line flex flex-col overflow-hidden rounded-[16px] border"
            >
              <div
                className="relative h-[76px] overflow-hidden"
                style={{ background: COVERS[i % COVERS.length] }}
              >
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 140 140"
                  aria-hidden="true"
                  className="absolute -top-10 -right-8 opacity-[0.18]"
                >
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="38"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="-mt-12 flex flex-1 flex-col items-center gap-1 px-[18px] pb-[18px] text-center">
                <span className="border-mnt-panel bg-mnt-brand/14 text-mnt-brand grid size-24 place-items-center rounded-full border-4 text-[28px] font-extrabold shadow-[0_2px_8px_rgba(17,2,99,0.15)]">
                  {initials(m.name)}
                </span>
                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  <h2 className="text-mnt-ink text-[16px] font-extrabold">
                    {m.name}
                  </h2>
                  <BadgeCheck
                    className="text-mnt-brand size-4"
                    aria-label="Verified mentor"
                  />
                </div>
                <div className="text-mnt-green text-[12px] font-bold">
                  {m.tier}
                </div>
                <p
                  className={
                    "min-h-[39px] text-[13px] leading-relaxed " +
                    (m.headline
                      ? "text-mnt-ink-muted"
                      : "text-mnt-faint italic")
                  }
                >
                  {m.headline ?? "Headline not added yet"}
                </p>
                <span className="bg-mnt-panel-2 text-mnt-ink-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold">
                  <Briefcase className="size-3" strokeWidth={2} />
                  {m.areaLabel}
                </span>
                {m.ratingCount > 0 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Stars value={m.ratingAvg} />
                    <span className="text-mnt-ink-muted text-[12px]">
                      {m.ratingAvg.toFixed(1)} ({m.ratingCount})
                    </span>
                  </div>
                )}
                <div className="mt-auto flex w-full flex-col items-center gap-2 pt-3.5">
                  <RequestControl
                    mentorId={m.id}
                    initialStatus={m.reqStatus}
                    canRequest={isValidated}
                  />
                  <Link
                    href={`/mentorship/mentors/${m.id}`}
                    className="border-mnt-brand text-mnt-brand hover:bg-mnt-brand/5 flex h-10 w-full items-center justify-center rounded-full border text-sm font-bold transition-colors"
                  >
                    View &amp; book a session
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
