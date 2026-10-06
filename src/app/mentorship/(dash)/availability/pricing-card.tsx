"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { saveMentorPricing } from "./actions";

export type Pricing = {
  paidSessionsEnabled: boolean;
  currency: string;
  // Amounts in MINOR units (kobo/cents), or null when not offered.
  standardAmount: number | null;
  specialistAmount: number | null;
  expertAmount: number | null;
  extensionEnabled: boolean;
  extensionAmount: number | null;
};

const CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"] as const;
const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};

const field =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand rounded-[10px] border px-3 py-2.5 text-[14px] outline-none";
const label = "text-mnt-ink-muted text-[12.5px] font-medium";
const btn =
  "bg-mnt-brand text-mnt-on-brand inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60";
const card = "bg-mnt-panel border-mnt-line rounded-2xl border p-5";

/** minor units -> major-unit string for an input value ("" when null). */
function toMajor(minor: number | null): string {
  if (minor == null) return "";
  return String(minor / 100);
}

/** major-unit string -> number|null for the server action. */
function toNumber(major: string): number | null {
  const t = major.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function PricingCard({ pricing }: { pricing: Pricing }) {
  const router = useRouter();

  const [paidEnabled, setPaidEnabled] = useState(pricing.paidSessionsEnabled);
  const [currency, setCurrency] = useState(pricing.currency);
  const [standard, setStandard] = useState(toMajor(pricing.standardAmount));
  const [specialist, setSpecialist] = useState(
    toMajor(pricing.specialistAmount),
  );
  const [expert, setExpert] = useState(toMajor(pricing.expertAmount));
  const [extensionEnabled, setExtensionEnabled] = useState(
    pricing.extensionEnabled,
  );
  const [extension, setExtension] = useState(toMajor(pricing.extensionAmount));

  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbol = SYMBOLS[currency] ?? currency;

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await saveMentorPricing({
        paidSessionsEnabled: paidEnabled,
        currency,
        standardAmount: toNumber(standard),
        specialistAmount: toNumber(specialist),
        expertAmount: toNumber(expert),
        extensionEnabled,
        extensionAmount: toNumber(extension),
      });
      if ("error" in res) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className={card}>
      <div className="text-mnt-ink text-[14px] font-bold">Session pricing</div>
      <p className="text-mnt-ink-muted mt-1 text-[13px] leading-relaxed">
        Offer paid 1:1 sessions. Mentees see these prices before they book.
        Leave paid sessions off to keep mentoring free. ETEN&apos;s commission
        is applied at checkout and shown to you in earnings.
      </p>

      <label className="mt-4 flex items-center gap-2.5 text-[13.5px]">
        <input
          type="checkbox"
          checked={paidEnabled}
          onChange={(e) => setPaidEnabled(e.target.checked)}
          className="accent-mnt-brand size-4"
        />
        <span className="font-medium">Offer paid sessions</span>
      </label>

      {paidEnabled && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

            <PriceInput
              id="standard"
              labelText="Standard session"
              hint="required"
              symbol={symbol}
              value={standard}
              onChange={setStandard}
            />
            <PriceInput
              id="specialist"
              labelText="Specialist session"
              hint="optional"
              symbol={symbol}
              value={specialist}
              onChange={setSpecialist}
            />
            <PriceInput
              id="expert"
              labelText="Expert consultation"
              hint="optional"
              symbol={symbol}
              value={expert}
              onChange={setExpert}
            />
          </div>

          <div className="border-mnt-line mt-5 border-t pt-4">
            <label className="flex items-center gap-2.5 text-[13.5px]">
              <input
                type="checkbox"
                checked={extensionEnabled}
                onChange={(e) => setExtensionEnabled(e.target.checked)}
                className="accent-mnt-brand size-4"
              />
              <span className="font-medium">
                Allow paid extensions (+30 minutes)
              </span>
            </label>
            {extensionEnabled && (
              <div className="mt-3 sm:max-w-[50%]">
                <PriceInput
                  id="extension"
                  labelText="Extension price"
                  hint="required"
                  symbol={symbol}
                  value={extension}
                  onChange={setExtension}
                />
              </div>
            )}
          </div>
        </>
      )}

      {error && <p className="text-destructive mt-3 text-[12.5px]">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={btn} disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save pricing"}
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

function PriceInput({
  id,
  labelText,
  hint,
  symbol,
  value,
  onChange,
}: {
  id: string;
  labelText: string;
  hint: string;
  symbol: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={label} htmlFor={id}>
        {labelText} <span className="text-mnt-faint">({hint})</span>
      </label>
      <div className="relative mt-1.5">
        <span className="text-mnt-faint pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px]">
          {symbol}
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step={500}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={field + " w-full pl-9"}
        />
      </div>
    </div>
  );
}
