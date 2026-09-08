"use client";

import { useState, useTransition } from "react";
import { setNotificationPreference } from "./actions";

export type PrefCategory = "comment" | "reaction" | "message";

type Pref = {
  key: PrefCategory;
  label: string;
  hint: string;
  enabled: boolean;
};

export function NotificationPreferences({ prefs }: { prefs: Pref[] }) {
  const [state, setState] = useState(prefs);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(key: PrefCategory, next: boolean) {
    setState((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: next } : p)),
    );
    setError(null);
    startTransition(async () => {
      const res = await setNotificationPreference({
        category: key,
        mode: next ? "realtime" : "off",
      });
      if ("error" in res) {
        setError(res.error);
        // revert on failure
        setState((prev) =>
          prev.map((p) => (p.key === key ? { ...p, enabled: !next } : p)),
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {state.map((p) => (
        <div key={p.key} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-on-surface text-sm font-medium">{p.label}</p>
            <p className="text-on-surface-variant text-xs">{p.hint}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={p.enabled}
            aria-label={`${p.label} notifications`}
            disabled={pending}
            onClick={() => toggle(p.key, !p.enabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
              p.enabled ? "bg-primary" : "bg-surface-container"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                p.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
