"use client";

import { useEffect, useState } from "react";

/** Early-join window: the room opens this many minutes before the start. */
const EARLY_JOIN_MIN = 10;

type Phase = "upcoming" | "live" | "ended";

const TONE: Record<Phase, string> = {
  upcoming: "bg-mnt-brand/15 text-mnt-brand",
  live: "bg-emerald-500/15 text-emerald-400",
  ended: "bg-mnt-line/40 text-mnt-faint",
};

const LABEL: Record<Phase, string> = {
  upcoming: "Upcoming",
  live: "Live",
  ended: "Ended",
};

function phaseFor(startMs: number, endMs: number, now: number): Phase {
  if (now >= endMs) return "ended";
  if (now >= startMs - EARLY_JOIN_MIN * 60_000) return "live";
  return "upcoming";
}

/**
 * Shows a scheduled class's start time in the viewer's local timezone plus a
 * live phase badge (Upcoming / Live / Ended). Time formatting and the phase are
 * computed after mount so the server render (unknown timezone / clock) never
 * mismatches the client. The room opens EARLY_JOIN_MIN before the start.
 */
export function ClassLive({
  startsAt,
  durationMinutes,
  joinHref,
}: {
  startsAt: string;
  durationMinutes: number;
  joinHref?: string;
}) {
  const startMs = Date.parse(startsAt);
  const endMs = startMs + durationMinutes * 60_000;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    // Defer the first tick out of the effect body so state isn't set
    // synchronously during render/commit.
    const kick = setTimeout(() => {
      setNow(Date.now());
      interval = setInterval(() => setNow(Date.now()), 30_000);
    }, 0);
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, []);

  if (now === null) {
    // Pre-hydration placeholder keeps the layout stable, no locale/clock used.
    return <span className="text-mnt-faint text-[11.5px]">Scheduled</span>;
  }

  const phase = phaseFor(startMs, endMs, now);
  const when = new Date(startMs).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-mnt-faint text-[11.5px]">{when}</span>
      <span
        className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.08em] uppercase ${TONE[phase]}`}
      >
        {LABEL[phase]}
      </span>
      {joinHref && phase !== "ended" && (
        <a
          href={joinHref}
          className="bg-mnt-brand text-mnt-on-brand rounded-full px-3 py-1 text-[11px] font-bold transition hover:brightness-110"
        >
          {phase === "live" ? "Join now" : "Open"}
        </a>
      )}
    </span>
  );
}
