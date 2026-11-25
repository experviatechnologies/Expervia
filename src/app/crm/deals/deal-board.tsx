"use client";

/**
 * Pipeline board: one column per stage. Cards move by drag and drop, or by
 * the "Move to" menu on each card (keyboard and touch friendly). The board
 * updates at once and rolls back if the save fails. Money and dates arrive
 * pre-formatted from the server.
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINES, type PipelineId } from "@/lib/crm/pipelines";
import type { DealRow, PipelineSummary } from "@/lib/crm/deals";
import { moveDealStage } from "./actions";

const OUTCOME_TINT = {
  open: "bg-[#fbfaff]",
  won: "bg-emerald-50/60",
  lost: "bg-slate-50",
} as const;

export function DealBoard({
  pipeline,
  deals: initialDeals,
  columns,
}: {
  pipeline: PipelineId;
  deals: DealRow[];
  columns: PipelineSummary["columns"];
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [asking, setAsking] = useState<{ id: string; stage: string } | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const stages = PIPELINES[pipeline].stages;

  function move(id: string, stage: string, lostReason?: string) {
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;
    const target = stages.find((s) => s.id === stage);
    if (target?.outcome === "lost" && lostReason === undefined) {
      setAsking({ id, stage });
      setReason("");
      return;
    }
    setError(null);
    const previous = deal.stage;
    setDeals((ds) =>
      ds.map((d) =>
        d.id === id ? { ...d, stage, stageLabel: target?.label ?? stage } : d,
      ),
    );
    setSavingId(id);
    start(async () => {
      const res = await moveDealStage(id, stage, lostReason);
      setSavingId(null);
      if (!res.ok) {
        setError(res.error);
        setDeals((ds) =>
          ds.map((d) => (d.id === id ? { ...d, stage: previous } : d)),
        );
      }
    });
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <ol className="flex min-w-max gap-3">
          {stages.map((s) => {
            const col = columns.find((c) => c.stageId === s.id);
            const inStage = deals.filter((d) => d.stage === s.id);
            return (
              <li
                key={s.id}
                aria-label={`${s.label}, ${inStage.length} deals`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(s.id);
                }}
                onDragLeave={() => setOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverStage(null);
                  if (dragId) move(dragId, s.id);
                  setDragId(null);
                }}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-2xl border border-[#ece9f5] p-3 transition-colors",
                  OUTCOME_TINT[s.outcome],
                  overStage === s.id && "border-brand-400 bg-brand-50",
                )}
              >
                <div className="mb-3 px-1">
                  <p className="text-ink flex items-center justify-between text-sm font-semibold">
                    {s.label}
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 tabular-nums">
                      {inStage.length}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {Math.round(s.probability * 100)}% likely
                    {col &&
                      col.total.length > 0 &&
                      ` · ${col.total.join(" + ")}`}
                  </p>
                </div>
                <ul className="flex min-h-16 flex-1 flex-col gap-2">
                  {inStage.map((d) => (
                    <li
                      key={d.id}
                      draggable
                      onDragStart={() => setDragId(d.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn(
                        "cursor-grab rounded-xl border border-[#ece9f5] bg-white p-3 shadow-[0_1px_2px_rgba(23,19,35,0.05)] active:cursor-grabbing",
                        dragId === d.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/crm/deals/${d.id}`}
                          className="text-ink hover:text-brand-700 text-sm font-semibold hover:underline"
                        >
                          {d.name}
                        </Link>
                        {savingId === d.id && (
                          <Loader2
                            aria-label="Saving"
                            className="text-brand-500 size-4 shrink-0 animate-spin"
                          />
                        )}
                      </div>
                      <p className="text-ink mt-1 text-sm font-semibold tabular-nums">
                        {d.amountMinor > 0 ? (
                          d.amountLabel
                        ) : (
                          <span className="font-normal text-slate-400">
                            No value yet
                          </span>
                        )}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        {d.company && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Building2
                              aria-hidden
                              className="size-3.5 shrink-0"
                            />
                            {d.company.name}
                          </p>
                        )}
                        {d.contact && (
                          <p className="flex items-center gap-1.5 truncate">
                            <User aria-hidden className="size-3.5 shrink-0" />
                            {d.contact.name}
                          </p>
                        )}
                        {d.closeLabel && (
                          <p
                            className={cn(
                              "flex items-center gap-1.5",
                              d.late && "font-semibold text-rose-700",
                            )}
                          >
                            {d.late ? (
                              <AlertCircle aria-hidden className="size-3.5" />
                            ) : (
                              <CalendarDays aria-hidden className="size-3.5" />
                            )}
                            {d.late ? "Past close date · " : "Close "}
                            {d.closeLabel}
                          </p>
                        )}
                        {d.ownerName && <p>Owner: {d.ownerName}</p>}
                      </div>

                      {asking?.id === d.id ? (
                        <form
                          className="mt-3 space-y-2 border-t border-[#f1eef8] pt-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const stage = asking.stage;
                            setAsking(null);
                            move(d.id, stage, reason);
                          }}
                        >
                          <label
                            htmlFor={`reason-${d.id}`}
                            className="block text-xs font-semibold text-slate-600"
                          >
                            Why was it lost? (optional)
                          </label>
                          <input
                            id={`reason-${d.id}`}
                            autoFocus
                            maxLength={300}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Went with another vendor"
                            className="focus:border-brand-400 focus:ring-brand-100 h-9 w-full rounded-lg border border-[#e4e0f0] px-2.5 text-sm outline-none focus:ring-3"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="bg-brand-700 hover:bg-brand-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Mark as lost
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsking(null)}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="mt-3 border-t border-[#f1eef8] pt-2">
                          <label htmlFor={`move-${d.id}`} className="sr-only">
                            Move {d.name} to
                          </label>
                          <select
                            id={`move-${d.id}`}
                            value={d.stage}
                            onChange={(e) => move(d.id, e.target.value)}
                            className="focus:border-brand-400 h-8 w-full rounded-lg border border-[#e4e0f0] bg-white px-2 text-xs text-slate-700 outline-none"
                          >
                            {stages.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.id === d.stage
                                  ? `Stage: ${o.label}`
                                  : `Move to ${o.label}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </li>
                  ))}
                  {inStage.length === 0 && (
                    <li className="rounded-xl border border-dashed border-[#e4e0f0] p-3 text-center text-xs text-slate-400">
                      No deals
                    </li>
                  )}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
