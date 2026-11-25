"use client";

/**
 * New contacts per week, stacked ETEN + Customers. Columns are focusable so
 * the tooltip works with a keyboard as well as a pointer; the same numbers are
 * always available in the table under the chart.
 *
 * Colours validated with the dataviz palette checker on white: ETEN #6426dc,
 * Customers #e0861a (CVD ΔE 37). The orange is under 3:1 on white, so the
 * legend and table view are required, not optional.
 */
import { useState } from "react";
import type { WeekBucket } from "@/lib/crm/dashboard";

const SERIES = [
  { key: "eten", label: "ETEN", color: "#6426dc" },
  { key: "customer", label: "Customers", color: "#e0861a" },
] as const;

const PLOT_HEIGHT = 200;

function niceStep(max: number) {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / mag;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  return Math.max(step, 1);
}

// Formatted by hand, not toLocaleDateString: server and browser ship
// different locale data ("Sept" vs "Sep"), which breaks hydration.
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const weekLabel = (start: string) => {
  const [, m, d] = start.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

export function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = weeks.map((w) => w.eten + w.customer);
  const peak = Math.max(...totals, 0);
  const step = niceStep(peak);
  const top = Math.max(step * Math.ceil(peak / step), step);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const peakIndex = totals.indexOf(peak);
  const px = (v: number) => (v / top) * PLOT_HEIGHT;

  return (
    <div>
      <ul
        className="mb-4 flex flex-wrap gap-4 text-xs text-slate-600"
        aria-label="Legend"
      >
        {SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px]"
              style={{ background: s.color }}
            />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        {/* Y axis */}
        <div
          aria-hidden
          className="relative w-8 shrink-0 text-right text-[11px] text-slate-500 tabular-nums"
          style={{ height: PLOT_HEIGHT }}
        >
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 translate-y-1/2"
              style={{ bottom: px(t) }}
            >
              {t.toLocaleString("en-GB")}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0"
            style={{ height: PLOT_HEIGHT }}
          >
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute inset-x-0 h-px bg-[#efedf5]"
                style={{ bottom: px(t) }}
              />
            ))}
          </div>

          {/* Columns */}
          <div
            className="relative flex items-end justify-between gap-1"
            style={{ height: PLOT_HEIGHT }}
            onPointerLeave={() => setActive(null)}
          >
            {weeks.map((w, i) => {
              const total = totals[i];
              const isActive = active === i;
              return (
                <div
                  key={w.start}
                  tabIndex={0}
                  role="img"
                  aria-label={`Week of ${weekLabel(w.start)}: ${w.eten} ETEN, ${w.customer} customers`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group focus-visible:ring-brand-300 relative flex h-full flex-1 cursor-default items-end justify-center rounded-md outline-none focus-visible:ring-2"
                >
                  <div
                    className="flex w-full max-w-6 flex-col-reverse gap-[2px] transition-opacity"
                    style={{ opacity: active === null || isActive ? 1 : 0.55 }}
                  >
                    {SERIES.map((s) => {
                      const v = w[s.key];
                      if (v === 0) return null;
                      const isTop = s.key === "customer" || w.customer === 0;
                      return (
                        <div
                          key={s.key}
                          style={{
                            height: Math.max(px(v), 2),
                            background: s.color,
                          }}
                          className={isTop ? "rounded-t-[4px]" : undefined}
                        />
                      );
                    })}
                  </div>

                  {/* One selective direct label: the busiest week. */}
                  {i === peakIndex && peak > 0 && !isActive && (
                    <span
                      aria-hidden
                      className="text-ink absolute text-[11px] font-semibold tabular-nums"
                      style={{ bottom: px(total) + 6 }}
                    >
                      {total.toLocaleString("en-GB")}
                    </span>
                  )}

                  {isActive && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute z-10 w-36 rounded-lg border border-[#ece9f5] bg-white p-2.5 text-xs shadow-lg"
                      style={{
                        bottom: Math.min(px(total) + 10, PLOT_HEIGHT - 40),
                        left: i > weeks.length / 2 ? "auto" : "50%",
                        right: i > weeks.length / 2 ? "50%" : "auto",
                      }}
                    >
                      <p className="mb-1.5 text-slate-500">
                        Week of {weekLabel(w.start)}
                      </p>
                      {SERIES.map((s) => (
                        <p key={s.key} className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="h-0.5 w-3 rounded-full"
                            style={{ background: s.color }}
                          />
                          <span className="text-ink font-semibold tabular-nums">
                            {w[s.key].toLocaleString("en-GB")}
                          </span>
                          <span className="text-slate-500">{s.label}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X axis: every other week, always including the latest. */}
          <div
            aria-hidden
            className="mt-2 flex justify-between gap-1 text-[11px] text-slate-500"
          >
            {weeks.map((w, i) => (
              <span
                key={w.start}
                className="flex-1 text-center whitespace-nowrap"
              >
                {(weeks.length - 1 - i) % 2 === 0 ? weekLabel(w.start) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="text-brand-700 cursor-pointer font-semibold hover:underline">
          Show as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th scope="col" className="py-1.5 pr-4 font-semibold">
                  Week of
                </th>
                <th
                  scope="col"
                  className="py-1.5 pr-4 text-right font-semibold"
                >
                  ETEN
                </th>
                <th
                  scope="col"
                  className="py-1.5 pr-4 text-right font-semibold"
                >
                  Customers
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eef8] tabular-nums">
              {weeks.map((w, i) => (
                <tr key={w.start}>
                  <th scope="row" className="py-1.5 pr-4 font-normal">
                    {weekLabel(w.start)}
                  </th>
                  <td className="py-1.5 pr-4 text-right">{w.eten}</td>
                  <td className="py-1.5 pr-4 text-right">{w.customer}</td>
                  <td className="py-1.5 text-right font-semibold">
                    {totals[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
