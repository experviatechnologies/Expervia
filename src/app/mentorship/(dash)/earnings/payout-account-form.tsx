"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
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

const field =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand rounded-[10px] border px-3 py-2.5 text-[14px] outline-none";
const label = "text-mnt-ink-muted text-[12.5px] font-medium";
const btn =
  "bg-mnt-brand text-mnt-on-brand inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60";

export function PayoutAccountForm({ account }: { account: PayoutAccount }) {
  const router = useRouter();
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    account?.accountNumber ?? "",
  );
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
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-mnt-ink text-[14px] font-bold">Payout account</div>
        {account &&
          (account.verified ? (
            <span className="text-mnt-green font-mono text-[10.5px] tracking-wide uppercase">
              Verified
            </span>
          ) : (
            <span className="text-mnt-amber font-mono text-[10.5px] tracking-wide uppercase">
              Pending verification
            </span>
          ))}
      </div>
      <p className="text-mnt-ink-muted mt-1 text-[13px] leading-relaxed">
        Where ETEN sends your earnings. Operations verify this before your first
        payout.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="bankName">
            Bank name
          </label>
          <input
            id="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className={field + " mt-1.5 w-full"}
            placeholder="e.g. Access Bank"
          />
        </div>
        <div>
          <label className={label} htmlFor="accountNumber">
            Account number
          </label>
          <input
            id="accountNumber"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className={field + " mt-1.5 w-full"}
            placeholder="0123456789"
          />
        </div>
        <div>
          <label className={label} htmlFor="accountName">
            Account name
          </label>
          <input
            id="accountName"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className={field + " mt-1.5 w-full"}
            placeholder="As it appears at your bank"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="bankCode">
              Bank code <span className="text-mnt-faint">(optional)</span>
            </label>
            <input
              id="bankCode"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className={field + " mt-1.5 w-full"}
              placeholder="e.g. 044"
            />
          </div>
          <div>
            <label className={label} htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={field + " mt-1.5 w-full"}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-destructive mt-3 text-[12.5px]">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={btn} disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save payout account"}
        </button>
        {saved && (
          <span className="text-mnt-green inline-flex items-center gap-1 text-[12.5px]">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
