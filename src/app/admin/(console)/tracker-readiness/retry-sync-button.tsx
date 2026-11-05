"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { retryEventSync } from "./actions";

/** Retry one meeting's calendar events now. */
export function RetrySyncButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          start(async () => {
            const res = await retryEventSync(requestId);
            setMsg(
              "error" in res
                ? res.error
                : res.failed
                  ? "Still failing"
                  : "Synced",
            );
            router.refresh();
          })
        }
        className="border-eten-line bg-eten-panel-hi text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="size-3.5" aria-hidden />
        )}
        Retry now
      </button>
      {msg && (
        <span role="status" className="text-eten-faint text-xs">
          {msg}
        </span>
      )}
    </span>
  );
}
