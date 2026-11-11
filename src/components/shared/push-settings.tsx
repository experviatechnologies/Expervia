"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, BellOff, Share } from "lucide-react";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
  setPushCategory,
} from "@/lib/pwa/push-actions";
import type { PushCategory } from "@/lib/pwa/push";
import { isInstalledApp, isIos, platformOf } from "@/lib/pwa/device";

/**
 * "Notifications on this device" (PWA phase 4): turn push on or off for the
 * phone or computer in hand, send a test, and choose which kinds arrive.
 * Shown on the member Settings page and the Mentorship notifications page.
 *
 * Asks the browser for permission only when the member presses the button,
 * never on page load. On iPhone and iPad, push works only once ETEN is
 * installed to the home screen (iOS 16.4 or later), so it says that instead.
 */

export type PushOption = { key: PushCategory; label: string; hint: string };

type State =
  | "loading"
  | "unsupported"
  | "ios-install"
  | "denied"
  | "off"
  | "on";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function toBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration("/")) ?? null;
}

export function PushSettings({
  options,
  muted,
}: {
  /** The kinds of notification this audience can choose from. */
  options: PushOption[];
  /** Kinds currently switched off for this member. */
  muted: PushCategory[];
}) {
  const [state, setState] = useState<State>("loading");
  const [off, setOff] = useState(new Set(muted));
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const supported =
        VAPID_KEY &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) {
        setState(isIos() && !isInstalledApp() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const reg = await registration();
      if (!reg) {
        setState("unsupported");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  const turnOn = () =>
    startTransition(async () => {
      setMessage(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      if (!reg) {
        setState("unsupported");
        return;
      }
      try {
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes(VAPID_KEY),
          }));
        const res = await savePushSubscription({
          endpoint: sub.endpoint,
          p256dh: toBase64(sub.getKey("p256dh")),
          auth: toBase64(sub.getKey("auth")),
          platform: platformOf(),
          userAgent: navigator.userAgent,
        });
        if ("error" in res) {
          await sub.unsubscribe();
          setMessage({ tone: "error", text: res.error });
          return;
        }
        setState("on");
        setMessage({
          tone: "ok",
          text: "Notifications are on for this device.",
        });
      } catch {
        setMessage({
          tone: "error",
          text: "This browser couldn't turn on notifications. Please try again.",
        });
      }
    });

  const turnOff = () =>
    startTransition(async () => {
      setMessage(null);
      const reg = await registration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    });

  const test = () =>
    startTransition(async () => {
      setMessage(null);
      const res = await sendTestPush();
      setMessage(
        "error" in res
          ? { tone: "error", text: res.error }
          : {
              tone: "ok",
              text: "Test sent. It should appear in a few seconds.",
            },
      );
    });

  const toggle = (key: PushCategory, enabled: boolean) => {
    const next = new Set(off);
    if (enabled) next.delete(key);
    else next.add(key);
    setOff(next);
    startTransition(async () => {
      const res = await setPushCategory({ category: key, enabled });
      if ("error" in res) {
        setOff(off);
        setMessage({ tone: "error", text: res.error });
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="bg-eten-accent-soft text-eten-accent grid size-10 shrink-0 place-items-center rounded-xl">
          {state === "on" ? (
            <BellRing className="size-5" />
          ) : (
            <BellOff className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-eten-ink text-sm font-semibold">
            {state === "on"
              ? "On for this device"
              : state === "loading"
                ? "Checking this device..."
                : "Off for this device"}
          </p>
          <p className="text-eten-ink-muted mt-0.5 text-sm">
            {state === "ios-install" ? (
              <>
                On iPhone and iPad, add ETEN to your home screen first: tap{" "}
                <Share
                  className="inline size-3.5 align-[-2px]"
                  aria-label="Share"
                />
                {
                  ' Share, then "Add to Home Screen". Then open ETEN from your home screen and come back here.'
                }
              </>
            ) : state === "unsupported" ? (
              "This browser can't show ETEN notifications. Try Chrome, Edge, Firefox or Safari, or the installed ETEN app."
            ) : state === "denied" ? (
              "Notifications are blocked for ETEN in this browser. Allow them in your browser or phone settings, then reload this page."
            ) : (
              "Get alerts on this phone or computer for the things below, even when ETEN is closed."
            )}
          </p>
        </div>
      </div>

      {(state === "off" || state === "on") && (
        <div className="flex flex-wrap gap-2">
          {state === "off" ? (
            <button
              type="button"
              onClick={turnOn}
              disabled={pending}
              className="bg-eten-accent hover:bg-eten-accent-press rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Turn on notifications
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={test}
                disabled={pending}
                className="bg-eten-accent hover:bg-eten-accent-press rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Send a test
              </button>
              <button
                type="button"
                onClick={turnOff}
                disabled={pending}
                className="border-eten-line text-eten-ink hover:bg-eten-hover rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                Turn off on this device
              </button>
            </>
          )}
        </div>
      )}

      {message && (
        <p
          role="status"
          className={
            "text-sm " +
            (message.tone === "ok" ? "text-eten-verified" : "text-destructive")
          }
        >
          {message.text}
        </p>
      )}

      <div className="border-eten-line-soft flex flex-col gap-4 border-t pt-5">
        <p className="text-eten-faint text-xs font-semibold tracking-wide uppercase">
          What to send to your devices
        </p>
        {options.map((o) => {
          const enabled = !off.has(o.key);
          return (
            <div
              key={o.key}
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-eten-ink text-sm font-medium">{o.label}</p>
                <p className="text-eten-ink-muted text-xs">{o.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${o.label} on your devices`}
                disabled={pending}
                onClick={() => toggle(o.key, !enabled)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                  enabled ? "bg-eten-accent" : "bg-eten-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0 size-5 rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
