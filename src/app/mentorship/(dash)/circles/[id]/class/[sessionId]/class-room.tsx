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
import { startExtensionPayment } from "./extension-actions";

/** The room opens this many minutes before the scheduled start. */
const EARLY_JOIN_MIN = 10;

const MONEY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};
function fmtMoney(minor: number, currency: string): string {
  const sym = MONEY_SYMBOLS[currency] ?? `${currency} `;
  return (
    sym + (minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
  );
}

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
  isMentor = false,
  hardCut = true,
  extension = null,
}: {
  sessionId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  circleHref: string;
  isMentor?: boolean;
  hardCut?: boolean;
  extension?: { amount: number; currency: string; minutes: number } | null;
}) {
  const router = useRouter();
  const startMs = Date.parse(startsAt);
  const endMs = startMs + durationMinutes * 60_000;

  const [now, setNow] = useState<number | null>(null);
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [extBusy, setExtBusy] = useState(false);
  const [endBusy, setEndBusy] = useState(false);

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

  // Pay to extend the session (+N minutes): hand off to Paystack checkout.
  const extend = useCallback(async () => {
    if (!extension) return;
    setActionError(null);
    setExtBusy(true);
    try {
      const res = await startExtensionPayment({ sessionId });
      if ("error" in res) {
        setActionError(res.error);
        setExtBusy(false);
      } else {
        window.location.href = res.authorizationUrl;
      }
    } catch {
      setActionError("Couldn't start the extension. Please try again.");
      setExtBusy(false);
    }
  }, [extension, sessionId]);

  // Mentor ends the meeting for everyone (no cron hard cut on 1:1 sessions).
  const endForAll = useCallback(async () => {
    setActionError(null);
    setEndBusy(true);
    try {
      await fetch("/api/mentorship/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // We leave regardless of the result.
    }
    setEndBusy(false);
    leave();
  }, [sessionId, leave]);

  // Hard cut: when the session end passes while connected, drop out of the room.
  // Group classes enforce this client-side; 1:1 sessions are mentor-ended, so
  // the cut is skipped there and the extra paid time stays usable.
  useEffect(() => {
    if (!(hardCut && conn && now !== null && now >= endMs)) return;
    const t = setTimeout(() => leave(), 0);
    return () => clearTimeout(t);
  }, [hardCut, conn, now, endMs, leave]);

  // Connected: render the conference full-bleed within the content area.
  if (conn) {
    const remaining = Math.max(0, endMs - (now ?? startMs));
    const mm = Math.floor(remaining / 60_000);
    const ss = Math.floor((remaining % 60_000) / 1_000);
    const warn = remaining > 0 && remaining <= 5 * 60_000;
    return (
      <div className="flex flex-col gap-2">
        <div
          className={
            "flex items-center justify-between rounded-xl border px-3.5 py-2 text-[12.5px] " +
            (warn
              ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
              : "border-mnt-line bg-mnt-panel-2 text-mnt-ink-muted")
          }
        >
          <span>
            Time left:{" "}
            <span className="font-mono font-bold">
              {mm}:{String(ss).padStart(2, "0")}
            </span>
          </span>
          <div className="flex items-center gap-2">
            {warn && (
              <span className="font-semibold">5 minutes or less left</span>
            )}
            {extension && (
              <button
                type="button"
                onClick={extend}
                disabled={extBusy}
                className="bg-mnt-brand text-mnt-on-brand rounded-lg px-2.5 py-1 text-[12px] font-bold transition hover:brightness-110 disabled:opacity-60"
              >
                {extBusy
                  ? "Starting…"
                  : `Extend +${extension.minutes} (${fmtMoney(extension.amount, extension.currency)})`}
              </button>
            )}
            {isMentor && (
              <button
                type="button"
                onClick={endForAll}
                disabled={endBusy}
                className="border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition disabled:opacity-60"
              >
                {endBusy ? "Ending…" : "End session"}
              </button>
            )}
          </div>
        </div>
        {actionError && (
          <p className="text-destructive text-[12px]">{actionError}</p>
        )}
        <div
          className="border-mnt-line overflow-hidden rounded-2xl border"
          style={{ height: "min(74vh, 700px)" }}
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
