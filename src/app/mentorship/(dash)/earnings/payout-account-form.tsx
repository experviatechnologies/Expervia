"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Landmark } from "lucide-react";
import { savePayoutAccount } from "./actions";

export type PayoutAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  currency: string;
  verified: boolean;
} | null;

const CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"] as const;

const ctl =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand h-[46px] w-full rounded-xl border px-3 text-[14px] outline-none transition-colors";
const lbl = "text-mnt-ink text-[13px] font-semibold";

export function PayoutAccountForm({ account }: { account: PayoutAccount }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!account);
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState(account?.accountName ?? "");
  const [bankCode, setBankCode] = useState(account?.bankCode ?? "");
  const [currency, setCurrency] = useState(account?.currency ?? "NGN");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await savePayoutAccount({
        bankName,
        accountNumber,
        accountName,
        bankCode,
        currency,
      });
      if ("error" in res) setError(res.error);
      else {
        setSaved(true);
        setEditing(false);
        router.refresh();
      }
    });
  }

  const masked = account
    ? "•••• •••• " + account.accountNumber.replace(/\s/g, "").slice(-4)
    : "";

  return (
    <section className="bg-mnt-panel border-mnt-line flex min-w-0 flex-[2_1_340px] flex-col gap-4 rounded-[18px] border p-6">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <h2 className="text-mnt-ink text-[17px] font-bold">Payout account</h2>
          <p className="text-mnt-ink-muted mt-1 text-[13px] leading-relaxed">
            Where ETEN sends your earnings.
          </p>
        </div>
        {account &&
          (account.verified ? (
            <span className="bg-mnt-green/12 text-mnt-green inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold">
              <span className="bg-mnt-green size-1.5 rounded-full" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-2.5 py-1 text-[12px] font-bold text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500" /> Pending
              verification
            </span>
          ))}
      </div>

      {account && !editing ? (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-4 rounded-2xl bg-[#110263] p-[18px] text-white">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold opacity-90">
                {account.bankName}
              </span>
              <Landmark className="size-5 opacity-80" strokeWidth={1.8} />
            </div>
            <div className="font-mono text-[18px] tracking-[0.12em]">
              {masked}
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">{account.accountName}</span>
              <span className="opacity-80">{account.currency}</span>
            </div>
          </div>
          <div className="bg-mnt-panel-2 text-mnt-ink-muted flex items-start gap-2.5 rounded-xl p-3 text-[13px] leading-relaxed">
            <Info className="text-mnt-brand mt-0.5 size-4 shrink-0" />
            Operations will verify this account before your first payout.
            We&apos;ll let you know when it&apos;s done.
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSaved(false);
              setAccountNumber("");
            }}
            className="border-mnt-line text-mnt-ink hover:border-mnt-brand h-11 rounded-xl border text-[14px] font-semibold transition"
          >
            Edit payout account
          </button>
          {saved && (
            <span
              role="status"
              className="text-mnt-green inline-flex items-center gap-1.5 text-[13px] font-semibold"
            >
              <Check className="size-4" strokeWidth={2.4} /> Payout account
              saved
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Bank name</span>
            <input
              className={ctl}
              type="text"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Access Bank"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Account number</span>
            <input
              className={ctl}
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setError(null);
              }}
              placeholder="10-digit account number"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={lbl}>Account name</span>
            <input
              className={ctl}
              type="text"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setError(null);
              }}
              placeholder="As it appears at your bank"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={lbl}>
                Bank code{" "}
                <span className="text-mnt-faint font-medium">(optional)</span>
              </span>
              <input
                className={ctl}
                type="text"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                placeholder="e.g. 044"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={lbl}>Currency</span>
              <select
                className={ctl}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-red-600 [background:rgba(239,68,68,0.1)] dark:text-red-400"
            >
              {error}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="bg-mnt-brand text-mnt-on-brand h-[46px] flex-1 rounded-xl text-[14px] font-bold transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save payout account"}
            </button>
            {account && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
                className="border-mnt-line text-mnt-ink-muted hover:border-mnt-brand hover:text-mnt-ink h-[46px] rounded-xl border px-4 text-[14px] font-semibold transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
