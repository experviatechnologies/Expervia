"use client";

import { useState } from "react";
import { Clock, CircleCheck, Landmark } from "lucide-react";

export type EarnRow = {
  id: string;
  amountMinor: number;
  currency: string;
  status: string; // pending | available (derived) | paid | reversed
  availableAtMs: number;
  dateIso: string;
};
export type PayoutRow = {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  method: string;
  dateIso: string;
};

const SYM: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};
function money(minor: number, currency: string): string {
  const sym = SYM[currency] ?? `${currency} `;
  return (
    sym + (minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
  );
}
function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Tab = "earnings" | "payouts";

export function EarningsHistory({
  earnings,
  payouts,
  nowMs,
}: {
  earnings: EarnRow[];
  payouts: PayoutRow[];
  nowMs: number;
}) {
  const [tab, setTab] = useState<Tab>("earnings");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "earnings", label: "Earnings", count: earnings.length },
    { id: "payouts", label: "Payouts", count: payouts.length },
  ];

  function earningState(r: EarnRow) {
    if (r.status === "paid")
      return {
        text: "Paid out",
        chip: "bg-mnt-brand/10 text-mnt-brand",
        tone: "bg-mnt-brand/10 text-mnt-brand",
        paid: true,
      };
    if (r.status === "reversed")
      return {
        text: "Reversed",
        chip: "[background:rgba(239,68,68,0.1)] text-red-600 dark:text-red-400",
        tone: "[background:rgba(239,68,68,0.1)] text-red-600 dark:text-red-400",
        paid: false,
      };
    if (r.availableAtMs <= nowMs)
      return {
        text: "Available",
        chip: "bg-mnt-green/12 text-mnt-green",
        tone: "bg-mnt-green/12 text-mnt-green",
        paid: false,
      };
    return {
      text: "Pending",
      chip: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
      tone: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
      paid: false,
    };
  }

  const empty =
    tab === "earnings" ? earnings.length === 0 : payouts.length === 0;

  return (
    <section className="bg-mnt-panel border-mnt-line flex min-w-0 flex-[3_1_480px] flex-col rounded-[18px] border">
      <div className="border-mnt-line flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5">
        <h2 className="text-mnt-ink text-[17px] font-bold">History</h2>
        <div
          role="tablist"
          aria-label="History type"
          className="bg-mnt-panel-2 flex gap-1 rounded-xl p-1"
        >
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={
                  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold transition " +
                  (on
                    ? "bg-mnt-panel text-mnt-ink shadow-sm"
                    : "text-mnt-ink-muted hover:text-mnt-ink")
                }
              >
                {t.label}
                <span
                  className={
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold " +
                    (on
                      ? "bg-mnt-brand/10 text-mnt-brand"
                      : "bg-mnt-panel text-mnt-ink-muted")
                  }
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {empty ? (
        <p className="text-mnt-faint px-6 py-10 text-center text-[13px]">
          {tab === "earnings"
            ? "No earnings yet. Paid sessions and extensions will show here."
            : "No payouts yet."}
        </p>
      ) : (
        <div className="flex flex-col">
          {tab === "earnings"
            ? earnings.map((r) => {
                const st = earningState(r);
                return (
                  <div
                    key={r.id}
                    className="border-mnt-line hover:bg-mnt-panel-2 flex items-center gap-3.5 border-b px-6 py-4 transition-colors last:border-b-0"
                  >
                    <span
                      className={
                        "grid size-10 shrink-0 place-items-center rounded-xl " +
                        st.tone
                      }
                    >
                      {st.paid ? (
                        <CircleCheck className="size-[18px]" strokeWidth={2} />
                      ) : (
                        <Clock className="size-[18px]" strokeWidth={2} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-mnt-ink text-[14px] font-bold">
                        Session earnings
                      </div>
                      <div className="text-mnt-ink-muted text-[12px]">
                        {fmt(r.dateIso)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-mnt-ink text-[16px] font-extrabold tabular-nums">
                        {money(r.amountMinor, r.currency)}
                      </span>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                          st.chip
                        }
                      >
                        {st.text}
                      </span>
                    </div>
                  </div>
                );
              })
            : payouts.map((p) => (
                <div
                  key={p.id}
                  className="border-mnt-line hover:bg-mnt-panel-2 flex items-center gap-3.5 border-b px-6 py-4 transition-colors last:border-b-0"
                >
                  <span className="bg-mnt-green/12 text-mnt-green grid size-10 shrink-0 place-items-center rounded-xl">
                    <Landmark className="size-[18px]" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-mnt-ink text-[14px] font-bold">
                      Payout
                    </div>
                    <div className="text-mnt-ink-muted text-[12px]">
                      {fmt(p.dateIso)} · {p.method}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-mnt-ink text-[16px] font-extrabold tabular-nums">
                      {money(p.amountMinor, p.currency)}
                    </span>
                    <span className="bg-mnt-green/12 text-mnt-green rounded-full px-2 py-0.5 text-[11px] font-bold capitalize">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      )}

      <div className="text-mnt-ink-muted px-6 py-3.5 text-[12px]">
        ETEN&apos;s commission is applied at checkout. Amounts shown are what
        you receive.
      </div>
    </section>
  );
}
