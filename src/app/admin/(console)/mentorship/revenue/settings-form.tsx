"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateMonetizationSettings } from "./actions";

export type MonetizationConfig = {
  commissionPercent: number;
  settlementHoldHours: number;
  refundFullHours: number;
  refundPartialHours: number;
  refundPartialPercent: number;
};

const field =
  "border-eten-line bg-black/20 text-eten-ink focus:border-eten-accent rounded-lg border px-3 py-2 text-sm outline-none";
const label = "text-eten-ink-muted text-xs font-medium";

export function SettingsForm({ initial }: { initial: MonetizationConfig }) {
  const router = useRouter();
  const [commission, setCommission] = useState(
    String(initial.commissionPercent),
  );
  const [hold, setHold] = useState(String(initial.settlementHoldHours));
  const [full, setFull] = useState(String(initial.refundFullHours));
  const [partial, setPartial] = useState(String(initial.refundPartialHours));
  const [partialPct, setPartialPct] = useState(
    String(initial.refundPartialPercent),
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateMonetizationSettings({
        commissionPercent: Number(commission),
        settlementHoldHours: Number(hold),
        refundFullHours: Number(full),
        refundPartialHours: Number(partial),
        refundPartialPercent: Number(partialPct),
      });
      if ("error" in res) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const num = (
    id: string,
    text: string,
    value: string,
    set: (v: string) => void,
    suffix: string,
  ) => (
    <div>
      <label className={label} htmlFor={id}>
        {text}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => set(e.target.value)}
          className={field + " w-24"}
        />
        <span className="text-eten-ink-muted text-xs">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {num(
          "commission",
          "Platform commission",
          commission,
          setCommission,
          "%",
        )}
        {num("hold", "Settlement hold", hold, setHold, "hours")}
        {num("full", "Full refund before", full, setFull, "hours")}
        {num("partial", "Partial refund before", partial, setPartial, "hours")}
        {num("partialPct", "Partial refund", partialPct, setPartialPct, "%")}
      </div>
      <p className="text-eten-ink-muted mt-3 text-xs">
        Cancel {full || "–"}h+ before a session for a full refund,{" "}
        {partial || "–"}
        h+ for {partialPct || "–"}%, otherwise no refund.
      </p>

      {error && <p className="text-destructive mt-3 text-xs">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-eten-accent inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {saved && (
          <span className="text-eten-verified inline-flex items-center gap-1 text-xs">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
