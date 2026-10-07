"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundPayment } from "./actions";

/** Full-refund button for one payment, operations only. Confirms first. */
export function RefundControl({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!confirm("Refund this payment in full?")) return;
    setError(null);
    start(async () => {
      const res = await refundPayment({ paymentId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="border-eten-line text-eten-ink-muted hover:text-destructive hover:border-destructive/50 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50"
      >
        {pending ? "Refunding…" : "Refund"}
      </button>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </div>
  );
}
