"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markMentorPayout } from "./actions";

/**
 * "Mark paid out" button for one mentor's available earnings. Confirms first
 * (this records a payout and marks earnings paid), then refreshes.
 */
export function PayoutControl({
  mentorId,
  disabled,
}: {
  mentorId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!confirm("Record a payout for this mentor's available earnings?")) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await markMentorPayout({ mentorId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending || disabled}
        className="bg-eten-accent inline-flex h-11 items-center gap-2 rounded-xl px-[18px] text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check className="size-4" strokeWidth={2} />
        {pending ? "Paying…" : "Mark paid out"}
      </button>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </div>
  );
}
