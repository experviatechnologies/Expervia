"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** True when a Turnstile site key is configured (widget will render). */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Turnstile failed to load"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget. Renders nothing (and never blocks) until a site
 * key is configured via NEXT_PUBLIC_TURNSTILE_SITE_KEY. Calls `onToken` with a
 * fresh token on success, or null when it expires/errors.
 */
export function TurnstileWidget({
  onToken,
  theme = "auto",
}: {
  onToken: (token: string | null) => void;
  theme?: "auto" | "light" | "dark";
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Keep the latest callback without re-running the render effect.
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !boxRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (token: string) => cb.current(token),
          "expired-callback": () => cb.current(null),
          "error-callback": () => cb.current(null),
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* already gone */
        }
      }
    };
  }, [theme]);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} className="min-h-[65px]" />;
}
