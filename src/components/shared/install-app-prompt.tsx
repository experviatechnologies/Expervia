"use client";

import { useEffect, useRef, useState } from "react";
import { Share, SquarePlus, X } from "lucide-react";
import { recordAppUsage } from "@/lib/pwa/actions";
import { isInAppBrowser, isInstalledApp, platformOf } from "@/lib/pwa/device";

/**
 * "Get the ETEN app" card for signed-in members (PWA phase 3), shown in the
 * member app and Mentorship shells.
 *
 *   - Android and desktop Chrome/Edge: a one-tap Install button (the browser's
 *     own install prompt, held back until we ask).
 *   - iPhone and iPad (Safari, or Chrome on iOS): short steps for Share, then
 *     "Add to Home Screen", since iOS has no install button.
 *   - Not shown on someone's first visit, in the installed app itself, or in
 *     in-app browsers (Facebook, Instagram, LinkedIn) that can't install.
 *   - "Not now" hides it for 14 days; after two dismissals it stops asking.
 *
 * Also records installs and opens of the installed app (once a day per device)
 * for the admin overview.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Prefs = { sessions: number; dismissals: number; snoozeUntil: number };

const PREFS_KEY = "eten-install-prompt";
const SESSION_KEY = "eten-install-session";
const OPENED_KEY = "eten-app-opened";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_DISMISSALS = 2;
const MIN_SESSIONS = 2;

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw)
      return { sessions: 0, dismissals: 0, snoozeUntil: 0, ...JSON.parse(raw) };
  } catch {}
  return { sessions: 0, dismissals: 0, snoozeUntil: 0 };
}

function writePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

export function InstallAppPrompt({
  aboveBottomNav = false,
}: {
  /** Sit above a fixed bottom navigation bar on phones. */
  aboveBottomNav?: boolean;
}) {
  const [mode, setMode] = useState<"native" | "ios" | null>(null);
  const deferred = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const platform = platformOf();

    // Opened from the home screen: record it (once a day) and never prompt.
    if (isInstalledApp()) {
      const today = new Date().toISOString().slice(0, 10);
      try {
        if (localStorage.getItem(OPENED_KEY) !== today) {
          localStorage.setItem(OPENED_KEY, today);
          void recordAppUsage({ event: "opened", platform });
        }
      } catch {
        void recordAppUsage({ event: "opened", platform });
      }
      return;
    }

    // Count visits (once per browser session), so we never ask on the first.
    const prefs = readPrefs();
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, "1");
        prefs.sessions += 1;
        writePrefs(prefs);
      }
    } catch {}
    const eligible =
      prefs.sessions >= MIN_SESSIONS &&
      prefs.dismissals < MAX_DISMISSALS &&
      Date.now() >= prefs.snoozeUntil &&
      !isInAppBrowser();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // we show our own card instead of the browser's bar
      deferred.current = e as InstallEvent;
      if (eligible) setMode("native");
    };
    const onInstalled = () => {
      setMode(null);
      deferred.current = null;
      void recordAppUsage({ event: "installed", platform });
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (eligible && platform === "ios") setMode("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    const p = readPrefs();
    writePrefs({
      ...p,
      dismissals: p.dismissals + 1,
      snoozeUntil: Date.now() + SNOOZE_MS,
    });
    setMode(null);
  };

  const install = async () => {
    const e = deferred.current;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    deferred.current = null;
    if (outcome === "accepted") setMode(null);
    else dismiss();
  };

  if (!mode) return null;

  return (
    <section
      aria-label="Install the ETEN app"
      className={
        "bg-eten-panel border-eten-line text-eten-ink fixed inset-x-3 z-40 mx-auto max-w-md rounded-2xl border p-4 shadow-xl md:inset-x-auto md:right-6 md:bottom-6 md:mx-0 md:w-[380px] " +
        (aboveBottomNav
          ? "bottom-[calc(76px+env(safe-area-inset-bottom))]"
          : "bottom-[calc(16px+env(safe-area-inset-bottom))]")
      }
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-snug font-bold">
            {mode === "ios"
              ? "Add ETEN to your home screen"
              : "Get the ETEN app"}
          </h2>
          <p className="text-eten-ink-muted mt-0.5 text-[13.5px] leading-snug">
            Open ETEN straight from your home screen, with quicker access to
            your dashboard, sessions and messages.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="text-eten-faint hover:text-eten-ink hover:bg-eten-hover -mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg"
        >
          <X className="size-4" />
        </button>
      </div>

      {mode === "ios" ? (
        <>
          <ol className="text-eten-ink-muted mt-3 flex flex-col gap-2 pl-0 text-[13.5px]">
            <li className="flex items-center gap-2.5">
              <Step n={1} />
              <span>
                Tap{" "}
                <Share
                  className="text-eten-accent inline size-4 align-[-3px]"
                  aria-label="Share"
                />{" "}
                <b className="text-eten-ink">Share</b>
                {" in your browser's toolbar"}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Step n={2} />
              <span>
                Scroll down and tap{" "}
                <SquarePlus
                  className="text-eten-accent inline size-4 align-[-3px]"
                  aria-hidden
                />{" "}
                <b className="text-eten-ink">Add to Home Screen</b>
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Step n={3} />
              <span>
                Tap <b className="text-eten-ink">Add</b>
              </span>
            </li>
          </ol>
          <button
            type="button"
            onClick={dismiss}
            className="border-eten-line text-eten-ink hover:bg-eten-hover mt-3 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            Got it
          </button>
        </>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="text-eten-ink-muted hover:bg-eten-hover flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={install}
            className="bg-eten-accent hover:bg-eten-accent-press flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            Install
          </button>
        </div>
      )}
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="bg-eten-accent-soft text-eten-accent grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold"
    >
      {n}
    </span>
  );
}
