"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { nudgeIncompleteMembers } from "./actions";

/** Email a reminder to incomplete members: everyone, or one pod. */
export function NudgeButton({
  podId,
  due,
  label,
  primary = false,
}: {
  podId?: string;
  /** How many would get it now (not reminded in the cooldown). */
  due: number;
  label: string;
  primary?: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy || due === 0}
        onClick={() => {
          if (
            !window.confirm(
              `Email a reminder to ${due} member${due === 1 ? "" : "s"}?`,
            )
          )
            return;
          start(async () => {
            setMsg(null);
            const res = await nudgeIncompleteMembers({ podId });
            setMsg(
              "error" in res
                ? res.error
                : `Sent ${res.sent}${res.failed ? `, ${res.failed} failed` : ""}${res.skipped ? `, ${res.skipped} reminded recently` : ""}.`,
            );
            router.refresh();
          });
        }}
        className={
          primary
            ? "bg-eten-accent inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            : "border-eten-line bg-eten-panel-hi text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
        }
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Send className="size-3.5" aria-hidden />
        )}
        {label}
      </button>
      {msg && (
        <span role="status" className="text-eten-faint text-xs">
          {msg}
        </span>
      )}
    </span>
  );
}
