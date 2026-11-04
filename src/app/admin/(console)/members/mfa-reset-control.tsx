"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resetTwoStepSignIn } from "./actions";

/**
 * Shows whether a member has two-step sign-in, and lets an admin reset it
 * (with a reason, recorded in the audit log) when they lose their phone.
 */
export function MfaResetControl({
  memberId,
  enabledAt,
  isSelf,
}: {
  memberId: string;
  /** When their authenticator app was set up; null when not set up. */
  enabledAt: string | null;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  if (!enabledAt) {
    return (
      <span className="border-eten-line bg-eten-panel-hi text-eten-ink-muted rounded-lg border px-3 py-1 text-sm font-semibold">
        Not set up
      </span>
    );
  }

  const since = new Date(enabledAt).toLocaleDateString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
  });

  function apply() {
    setError(null);
    startTransition(async () => {
      const res = await resetTwoStepSignIn({ memberId, reason });
      if ("error" in res) {
        setError(res.error);
      } else {
        setOpen(false);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="border-eten-accent/40 bg-eten-accent-soft text-eten-accent rounded-lg border px-3 py-1 text-sm font-semibold">
          ✓ On since {since}
        </span>
        {!isSelf && (
          <button
            type="button"
            disabled={busy}
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
              setError(null);
            }}
            className="border-eten-line bg-eten-panel-hi text-eten-ink-muted hover:text-eten-ink rounded-lg border px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            Reset
          </button>
        )}
      </div>
      {open && (
        <form
          className="flex w-full max-w-[420px] flex-wrap items-center justify-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <label htmlFor={`mfa-reset-reason-${memberId}`} className="sr-only">
            Reason
          </label>
          <input
            id={`mfa-reset-reason-${memberId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason, e.g. lost phone (confirmed by call)"
            className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy || reason.trim().length < 3}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Reset"}
          </button>
        </form>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
