"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";

/** The room opens this many minutes before the scheduled start. */
const EARLY_JOIN_MIN = 10;

type Phase = "upcoming" | "live" | "ended";

function phaseFor(startMs: number, endMs: number, now: number): Phase {
  if (now >= endMs) return "ended";
  if (now >= startMs - EARLY_JOIN_MIN * 60_000) return "live";
  return "upcoming";
}

function countdown(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  const s = total % 60;
  return `${m}m ${s}s`;
}

/**
 * The in-app live class. Before the join window it shows a countdown; once the
 * room is open it fetches a short-lived LiveKit token from the server (which
 * also returns the server URL, so no public env var is needed) and embeds the
 * LiveKit conference. Phase is computed after mount to avoid hydration
 * mismatch on time.
 */
export function ClassRoom({
  sessionId,
  title,
  startsAt,
  durationMinutes,
  circleHref,
}: {
  sessionId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  circleHref: string;
}) {
  const router = useRouter();
  const startMs = Date.parse(startsAt);
  const endMs = startMs + durationMinutes * 60_000;

  const [now, setNow] = useState<number | null>(null);
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const kick = setTimeout(() => {
      setNow(Date.now());
      interval = setInterval(() => setNow(Date.now()), 1000);
    }, 0);
    return () => {
      clearTimeout(kick);
      clearInterval(interval);
    };
  }, []);

  const join = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/mentorship/livekit-token?sessionId=${encodeURIComponent(sessionId)}`,
      );
      const data = (await res.json()) as {
        token?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.token || !data.url) {
        setError(data.error ?? "Couldn't join the class. Please try again.");
        return;
      }
      setConn({ token: data.token, url: data.url });
    } catch {
      setError("Couldn't reach the meeting server. Please try again.");
    } finally {
      setJoining(false);
    }
  }, [sessionId]);

  const leave = useCallback(() => {
    setConn(null);
    router.refresh();
  }, [router]);

  // Connected: render the conference full-bleed within the content area.
  if (conn) {
    return (
      <div
        className="border-mnt-line overflow-hidden rounded-2xl border"
        style={{ height: "min(78vh, 720px)" }}
        data-lk-theme="default"
      >
        <LiveKitRoom
          serverUrl={conn.url}
          token={conn.token}
          connect
          audio
          video
          onDisconnected={leave}
          style={{ height: "100%" }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  const phase = now === null ? null : phaseFor(startMs, endMs, now);
  const when =
    now === null
      ? "Scheduled"
      : new Date(startMs).toLocaleString(undefined, {
          weekday: "long",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

  return (
    <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-6 sm:p-8">
      <Link
        href={circleHref}
        className="text-mnt-faint hover:text-mnt-ink text-[12.5px]"
      >
        ← Back to Circle
      </Link>

      <h1 className="font-display mt-4 text-[22px] font-bold sm:text-[26px]">
        {title}
      </h1>
      <p className="text-mnt-ink-muted mt-1.5 text-[13.5px]">{when}</p>

      {phase === null && (
        <p className="text-mnt-faint mt-6 text-[13px]">Loading…</p>
      )}

      {phase === "upcoming" && now !== null && (
        <div className="mt-6">
          <div className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-5">
            <div className="text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase">
              Starts in
            </div>
            <div className="font-display mt-1 text-[28px] font-bold">
              {countdown(startMs - EARLY_JOIN_MIN * 60_000 - now)}
            </div>
            <p className="text-mnt-ink-muted mt-2 text-[12.5px]">
              The room opens {EARLY_JOIN_MIN} minutes before the class begins.
              Keep this page open, the Join button will appear automatically.
            </p>
          </div>
        </div>
      )}

      {phase === "live" && (
        <div className="mt-6">
          <button
            type="button"
            onClick={join}
            disabled={joining}
            className="bg-mnt-brand text-mnt-on-brand rounded-[10px] px-5 py-3 text-[14px] font-bold transition hover:brightness-110 disabled:opacity-60"
          >
            {joining ? "Joining…" : "Join the class"}
          </button>
          <p className="text-mnt-ink-muted mt-3 text-[12.5px]">
            You will be asked to allow your camera and microphone.
          </p>
        </div>
      )}

      {phase === "ended" && (
        <p className="text-mnt-faint mt-6 text-[13px]">This class has ended.</p>
      )}

      {error && <p className="text-destructive mt-4 text-[13px]">{error}</p>}
    </div>
  );
}
