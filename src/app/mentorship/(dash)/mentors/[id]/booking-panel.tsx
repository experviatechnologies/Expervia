"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { BookableSlot, AvailabilityStatus } from "@/lib/eten/availability";
import {
  requestSessionBooking,
  startPaidBooking,
  cancelSessionBooking,
  cancelAcceptedBooking,
} from "../booking-actions";

export type MyBooking = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
};

export type BookingPricing = { currency: string; standardAmount: number };

const btn =
  "bg-mnt-brand text-mnt-on-brand inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60";

const MONEY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};

function fmtMoney(minor: number, currency: string): string {
  const sym = MONEY_SYMBOLS[currency] ?? `${currency} `;
  return (
    sym + (minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
  );
}

function fmtDay(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}
function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtFull(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingPanel({
  mentorId,
  status,
  mentorTimezone,
  durationMinutes,
  slots,
  canBook,
  myBookings,
  pricing,
}: {
  mentorId: string;
  status: AvailabilityStatus;
  mentorTimezone: string;
  durationMinutes: number;
  slots: BookableSlot[];
  canBook: boolean;
  myBookings: MyBooking[];
  pricing: BookingPricing | null;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Group slots by local calendar day once mounted (local tz known).
  const grouped = useMemo(() => {
    const groups = new Map<string, BookableSlot[]>();
    for (const s of slots) {
      const key = fmtDay(Date.parse(s.start));
      const list = groups.get(key) ?? [];
      list.push(s);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [slots]);

  function book() {
    if (!selected) return;
    setError(null);
    setDone(false);
    start(async () => {
      // Paid mentor: start checkout and hand off to Paystack's hosted page.
      if (pricing) {
        const res = await startPaidBooking({ mentorId, startsAt: selected });
        if ("error" in res) setError(res.error);
        else window.location.href = res.authorizationUrl;
        return;
      }
      // Free mentor: the existing request-then-confirm flow.
      const res = await requestSessionBooking({ mentorId, startsAt: selected });
      if ("error" in res) setError(res.error);
      else {
        setSelected(null);
        setDone(true);
        router.refresh();
      }
    });
  }

  function cancel(bookingId: string) {
    setError(null);
    start(async () => {
      const res = await cancelSessionBooking({ bookingId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function cancelConfirmed(bookingId: string) {
    if (
      !window.confirm(
        "Cancel this session? Any refund follows the cancellation policy based on how soon the session is.",
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await cancelAcceptedBooking({ bookingId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-5">
      {myBookings.length > 0 && (
        <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-5">
          <div className="text-mnt-ink text-[14px] font-bold">
            Your sessions with this mentor
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between rounded-xl border px-3.5 py-2.5"
              >
                <span className="text-[13.5px]">
                  <span className="font-semibold">
                    {mounted ? fmtFull(Date.parse(b.startsAt)) : "Scheduled"}
                  </span>
                  <span
                    className={
                      b.status === "accepted"
                        ? "text-mnt-green ml-2 font-mono text-[10.5px] uppercase"
                        : "text-mnt-faint ml-2 font-mono text-[10.5px] uppercase"
                    }
                  >
                    {b.status === "accepted" ? "Confirmed" : "Pending"}
                  </span>
                </span>
                {b.status === "pending" && (
                  <button
                    type="button"
                    className="text-mnt-faint hover:text-destructive inline-flex items-center gap-1 text-[12px] transition"
                    disabled={pending}
                    onClick={() => cancel(b.id)}
                  >
                    <X className="size-3.5" /> Cancel
                  </button>
                )}
                {b.status === "accepted" &&
                  now !== null &&
                  Date.parse(b.startsAt) > now && (
                    <button
                      type="button"
                      className="text-mnt-faint hover:text-destructive inline-flex items-center gap-1 text-[12px] transition"
                      disabled={pending}
                      onClick={() => cancelConfirmed(b.id)}
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-5">
        {!canBook ? (
          <p className="text-mnt-ink-muted text-[13.5px]">
            Validate your ETEN membership to book a session.{" "}
            <Link
              href="/mentorship/validate"
              className="text-mnt-brand underline"
            >
              Validate now
            </Link>
          </p>
        ) : status === "unavailable" ? (
          <p className="text-mnt-ink-muted text-[13.5px]">
            This mentor isn&apos;t accepting bookings right now.
          </p>
        ) : slots.length === 0 ? (
          <p className="text-mnt-ink-muted text-[13.5px]">
            No open times in the next two weeks. Check back soon, or request 1:1
            mentorship above.
          </p>
        ) : (
          <>
            {pricing && (
              <p className="text-mnt-ink mb-3 text-[13px]">
                <span className="font-semibold">
                  {fmtMoney(pricing.standardAmount, pricing.currency)}
                </span>{" "}
                <span className="text-mnt-faint">
                  per session · {durationMinutes} min · paid at checkout
                </span>
              </p>
            )}
            {status === "limited" && (
              <p className="text-mnt-faint mb-3 text-[12.5px]">
                Limited availability. Grab a time while it lasts.
              </p>
            )}
            {done && (
              <p className="text-mnt-green mb-3 inline-flex items-center gap-1 text-[12.5px]">
                <Check className="size-4" /> Request sent. The mentor will
                confirm.
              </p>
            )}
            {!mounted ? (
              <p className="text-mnt-faint text-[13px]">Loading times…</p>
            ) : (
              <div className="flex flex-col gap-4">
                {grouped.map(([day, daySlots]) => (
                  <div key={day}>
                    <div className="text-mnt-ink-muted text-[12.5px] font-semibold">
                      {day}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {daySlots.map((s) => {
                        const active = selected === s.start;
                        return (
                          <button
                            key={s.start}
                            type="button"
                            onClick={() => setSelected(active ? null : s.start)}
                            className={
                              "rounded-[10px] border px-3 py-2 text-[13px] font-semibold transition " +
                              (active
                                ? "border-mnt-brand bg-mnt-brand/15 text-mnt-brand"
                                : "border-mnt-line bg-mnt-panel-2 text-mnt-ink hover:border-mnt-brand/60")
                            }
                          >
                            {fmtTime(Date.parse(s.start))}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-destructive mt-3 text-[12.5px]">{error}</p>
            )}

            {selected && mounted && (
              <div className="border-mnt-line mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span className="text-[13.5px]">
                  <span className="text-mnt-ink-muted">
                    {pricing ? "Book " : "Request "}
                  </span>
                  <span className="font-semibold">
                    {fmtFull(Date.parse(selected))}
                  </span>
                  <span className="text-mnt-faint">
                    {" "}
                    · {durationMinutes} min
                  </span>
                </span>
                <button
                  type="button"
                  className={btn}
                  disabled={pending}
                  onClick={book}
                >
                  {pending
                    ? pricing
                      ? "Starting…"
                      : "Sending…"
                    : pricing
                      ? `Book & pay ${fmtMoney(pricing.standardAmount, pricing.currency)}`
                      : "Request this time"}
                </button>
              </div>
            )}

            <p className="text-mnt-faint mt-4 text-[11.5px]">
              Mentor timezone: {mentorTimezone}. Shown above in your local time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
