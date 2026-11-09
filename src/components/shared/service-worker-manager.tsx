"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Registers the ETEN service worker (/sw.js) and handles updates.
 *
 * After a deploy, the browser finds a new /sw.js and installs it alongside the
 * running one. In the installed app, where people keep ETEN open for days, we
 * ask "A new version of ETEN is ready" and reload on Refresh. In a normal
 * browser tab the new worker simply takes over quietly: it never stores pages,
 * so switching under an open page is safe, and the next navigation loads the
 * new version anyway.
 *
 * Production only: in development the worker would cache files that change
 * on every save, so any existing registration is removed instead.
 */

const CHECK_EVERY_MS = 30 * 60 * 1000;

function isInstalledApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iPhone home-screen apps
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function ServiceWorkerManager() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;
    let lastCheck = Date.now();

    // A new worker is installed and waiting: prompt in the app, swap quietly
    // in a browser tab.
    const offer = (worker: ServiceWorker) => {
      if (!navigator.serviceWorker.controller) return; // first install
      if (isInstalledApp()) setWaiting(worker);
      else worker.postMessage({ type: "SKIP_WAITING" });
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const incoming = reg.installing;
        incoming?.addEventListener("statechange", () => {
          if (incoming.state === "installed") offer(incoming);
        });
      });
    };

    const check = () => {
      if (!registration || Date.now() - lastCheck < CHECK_EVERY_MS) return;
      lastCheck = Date.now();
      registration.update().catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    // Reload only when the person chose Refresh, not on a quiet swap.
    const onControllerChange = () => {
      if (!reloading.current) return;
      window.location.reload();
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        watch(reg);
      })
      .catch((err) => console.error("Service worker registration failed", err));

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(check, CHECK_EVERY_MS);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[#eceaf4] bg-white p-3 pl-4 text-sm text-[#17123d] shadow-lg sm:inset-x-auto sm:right-4 sm:left-auto"
      style={{ marginTop: "env(safe-area-inset-top)" }}
    >
      <p className="m-0 flex-1 leading-snug">A new version of ETEN is ready.</p>
      <button
        type="button"
        onClick={() => setWaiting(null)}
        className="rounded-lg px-3 py-2 font-medium text-[#5e5a7d] hover:bg-[#f4f0fe] focus-visible:outline-2 focus-visible:outline-[#4a16c4]"
      >
        Later
      </button>
      <button
        type="button"
        onClick={() => {
          reloading.current = true;
          waiting.postMessage({ type: "SKIP_WAITING" });
        }}
        className="rounded-lg bg-[#4a16c4] px-3 py-2 font-semibold text-white hover:bg-[#2e0a86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a16c4]"
      >
        Refresh
      </button>
    </div>
  );
}
