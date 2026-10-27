"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Check, Clock } from "lucide-react";
import { createGuestBooking, type SessionTier } from "./actions";

export type SessionTypeOption = {
  id: SessionTier;
  title: string;
  text: string;
  mins: number;
  amount: number; // minor units
};

const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};

const FALLBACK_TZS = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Toronto",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "UTC",
];

function money(amountMinor: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? currency + " ";
  return sym + (amountMinor / 100).toLocaleString("en-US");
}

/** Date/time parts for an ISO-UTC instant, rendered in a given IANA zone. */
function partsInZone(iso: string, tz: string) {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const p = Object.fromEntries(
    f.formatToParts(d).map((x) => [x.type, x.value]),
  );
  return {
    key: `${p.year}-${p.month}-${p.day}`,
    dayLabel: `${p.weekday} ${p.day} ${p.month}`,
    dowShort: (p.weekday ?? "").slice(0, 2),
    dayNum: p.day ?? "",
    time: `${p.hour}:${p.minute} ${(p.dayPeriod ?? "").toLowerCase()}`.trim(),
  };
}

const field =
  "border-mnt-line bg-mnt-panel text-mnt-ink focus:border-mnt-brand h-[46px] w-full rounded-xl border px-3 text-[14px] outline-none";
const primaryBtn =
  "bg-mnt-brand text-mnt-on-brand inline-flex h-12 items-center justify-center rounded-xl px-4 text-[15px] font-bold transition hover:brightness-110 disabled:opacity-60";
const ghostBtn =
  "border-mnt-line text-mnt-ink-muted hover:border-mnt-brand hover:text-mnt-ink inline-flex h-12 items-center justify-center rounded-xl border px-4 text-[14px] font-semibold transition";

export function GuestBookingWidget({
  mentorId,
  mentorFirstName,
  currency,
  types,
  slots,
}: {
  mentorId: string;
  mentorFirstName: string;
  currency: string;
  types: SessionTypeOption[];
  slots: string[]; // ISO UTC
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [tier, setTier] = useState<SessionTier>(types[0]?.id ?? "standard");
  const [tz, setTz] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [day, setDay] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const zones = useMemo(() => {
    let list = FALLBACK_TZS;
    try {
      const supported = (
        Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
      ).supportedValuesOf?.("timeZone");
      if (supported?.length) list = supported;
    } catch {
      /* curated fallback */
    }
    return list.includes(tz) ? list : [tz, ...list];
  }, [tz]);

  // Group open slots into local days for the chosen zone.
  const byDay = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        dow: string;
        num: string;
        slots: { iso: string; time: string }[];
      }
    >();
    for (const iso of slots) {
      const p = partsInZone(iso, tz);
      const entry = map.get(p.key) ?? {
        label: p.dayLabel,
        dow: p.dowShort,
        num: p.dayNum,
        slots: [],
      };
      entry.slots.push({ iso, time: p.time });
      map.set(p.key, entry);
    }
    return map;
  }, [slots, tz]);

  const dayKeys = useMemo(() => Array.from(byDay.keys()).sort(), [byDay]);
  const selectedDay = day && byDay.has(day) ? day : dayKeys[0];
  const daySlots = selectedDay ? (byDay.get(selectedDay)?.slots ?? []) : [];

  const selType = types.find((t) => t.id === tier) ?? types[0];
  const selSlot = slot ? partsInZone(slot, tz) : null;
  const zoneShort = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
  const whenLabel = selSlot
    ? `${selSlot.dayLabel}, ${selSlot.time} (${zoneShort})`
    : "";

  function go(next: 1 | 2 | 3 | 4) {
    setError(null);
    setStep(next);
  }

  function submit() {
    if (!selType) return;
    if (!slot) {
      setError("Pick a time to continue.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Add your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Add a valid email so we can send the link.");
      return;
    }
    start(async () => {
      const res = await createGuestBooking({
        mentorId,
        startsAt: slot,
        tier,
        name: name.trim(),
        email: email.trim(),
        goal: goal.trim() || undefined,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      window.location.href = res.authorizationUrl;
    });
  }

  const cardTitles = {
    1: "Book a session",
    2: "Pick a time",
    3: "Your details",
    4: "Review and pay",
  } as const;

  return (
    <div className="bg-mnt-panel border-mnt-line overflow-hidden rounded-[20px] border shadow-[0_16px_40px_rgba(17,2,99,0.1)]">
      <div className="border-mnt-line flex flex-col gap-3 border-b p-5">
        <h2 className="text-mnt-ink text-[18px] font-extrabold">
          {cardTitles[step]}
        </h2>
        <div className="flex gap-1.5" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={
                "h-1 flex-1 rounded-full " +
                (n <= step ? "bg-mnt-brand" : "bg-mnt-panel-2")
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3.5 p-5">
        {/* Step 1: session type */}
        {step === 1 && (
          <>
            <div
              role="radiogroup"
              aria-label="Session type"
              className="flex flex-col gap-2.5"
            >
              {types.map((t) => {
                const on = t.id === tier;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setTier(t.id)}
                    className={
                      "flex items-center gap-3 rounded-[14px] border p-3.5 text-left transition " +
                      (on
                        ? "border-mnt-brand bg-mnt-brand/[0.04]"
                        : "border-mnt-line hover:border-mnt-brand/40")
                    }
                  >
                    <span
                      className={
                        "mt-0.5 size-[18px] shrink-0 rounded-full border-2 " +
                        (on
                          ? "border-mnt-brand border-[6px]"
                          : "border-mnt-line")
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-mnt-ink block text-[15px] font-bold">
                        {t.title}
                      </span>
                      <span className="text-mnt-ink-muted block text-[12px] leading-relaxed">
                        {t.text}
                      </span>
                      <span className="text-mnt-faint mt-1 inline-flex items-center gap-1 text-[12px]">
                        <Clock className="size-3" /> {t.mins} min · video call
                      </span>
                    </span>
                    <span className="text-mnt-ink text-[16px] font-extrabold whitespace-nowrap">
                      {money(t.amount, currency)}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" className={primaryBtn} onClick={() => go(2)}>
              Choose a time
            </button>
          </>
        )}

        {/* Step 2: date + time */}
        {step === 2 && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-mnt-ink-muted text-[13px] font-semibold">
                Your time zone
              </span>
              <select
                value={tz}
                onChange={(e) => {
                  setTz(e.target.value);
                  setDay("");
                  setSlot("");
                }}
                className={field}
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>

            {dayKeys.length === 0 ? (
              <div className="text-mnt-ink-muted bg-mnt-panel-2 rounded-xl px-3 py-4 text-center text-[13px]">
                {mentorFirstName} has no open times right now. Please check back
                soon.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {dayKeys.map((k) => {
                    const d = byDay.get(k)!;
                    const on = k === selectedDay;
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setDay(k);
                          setSlot("");
                        }}
                        className={
                          "flex h-[58px] w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl border text-center " +
                          (on
                            ? "border-mnt-brand bg-mnt-brand text-mnt-on-brand"
                            : "border-mnt-line text-mnt-ink hover:border-mnt-brand/40")
                        }
                      >
                        <span className="text-[10px] font-bold uppercase opacity-80">
                          {d.dow}
                        </span>
                        <span className="text-[16px] font-extrabold">
                          {d.num}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-mnt-ink text-[13px] font-bold">
                  {selectedDay ? byDay.get(selectedDay)?.label : ""}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {daySlots.map((s) => {
                    const on = s.iso === slot;
                    return (
                      <button
                        key={s.iso}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSlot(s.iso)}
                        className={
                          "h-[42px] rounded-[10px] border text-[13px] font-bold transition " +
                          (on
                            ? "border-mnt-brand bg-mnt-brand text-mnt-on-brand"
                            : "border-mnt-line text-mnt-brand hover:border-mnt-brand")
                        }
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="flex gap-2.5">
              <button type="button" className={ghostBtn} onClick={() => go(1)}>
                Back
              </button>
              <button
                type="button"
                className={primaryBtn + " flex-1"}
                onClick={() => {
                  if (!slot) {
                    setError("Pick a time to continue.");
                    return;
                  }
                  go(3);
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3: details */}
        {step === 3 && (
          <>
            <div className="bg-mnt-panel-2 text-mnt-ink flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px]">
              <CalendarDays className="text-mnt-brand size-4 shrink-0" />
              <span className="font-semibold">{whenLabel}</span>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-mnt-ink-muted text-[13px] font-semibold">
                Full name
              </span>
              <input
                className={field}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-mnt-ink-muted text-[13px] font-semibold">
                Email
              </span>
              <input
                className={field}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-mnt-ink-muted text-[13px] font-semibold">
                What would you like help with?
              </span>
              <textarea
                className={
                  field + " h-auto min-h-[84px] resize-y py-2.5 leading-relaxed"
                }
                placeholder="e.g. I'm preparing for the AWS Solutions Architect exam and want a study plan"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </label>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="flex gap-2.5">
              <button type="button" className={ghostBtn} onClick={() => go(2)}>
                Back
              </button>
              <button
                type="button"
                className={primaryBtn + " flex-1"}
                onClick={() => {
                  if (name.trim().length < 2) {
                    setError("Add your name.");
                    return;
                  }
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                    setError("Add a valid email so we can send the link.");
                    return;
                  }
                  go(4);
                }}
              >
                Review and pay
              </button>
            </div>
          </>
        )}

        {/* Step 4: review + pay */}
        {step === 4 && selType && (
          <>
            <div className="border-mnt-line flex flex-col gap-2.5 rounded-[14px] border p-3.5">
              <div className="text-mnt-ink text-[14px] font-bold">
                {selType.title} with {mentorFirstName}
              </div>
              <div className="text-mnt-ink-muted text-[12px]">{whenLabel}</div>
              <div className="border-mnt-line mt-1 flex items-center justify-between border-t pt-2.5 text-[15px] font-extrabold">
                <span className="text-mnt-ink">Total</span>
                <span className="text-mnt-ink">
                  {money(selType.amount, currency)}
                </span>
              </div>
            </div>
            <p className="text-mnt-ink-muted text-[12px] leading-relaxed">
              Payment is held securely by ETEN and released to the mentor after
              the session. You can reschedule for free up to 24 hours before.
            </p>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="flex gap-2.5">
              <button
                type="button"
                className={ghostBtn}
                onClick={() => go(3)}
                disabled={pending}
              >
                Back
              </button>
              <button
                type="button"
                className={primaryBtn + " flex-1"}
                onClick={submit}
                disabled={pending}
              >
                {pending
                  ? "Starting checkout…"
                  : `Pay ${money(selType.amount, currency)}`}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-mnt-panel-2 border-mnt-line text-mnt-ink-muted flex items-center gap-2 border-t px-5 py-3 text-[12px]">
        <Check className="text-mnt-green size-3.5" strokeWidth={3} />
        Secure payment through ETEN · Verified by the ETEN Readiness Panel
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-red-600 [background:rgba(239,68,68,0.1)] dark:text-red-400"
    >
      {children}
    </div>
  );
}
