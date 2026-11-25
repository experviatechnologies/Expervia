"use client";

/** Clickable stage bar on a deal page. Lost stages ask for a reason. */
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINES, type PipelineId } from "@/lib/crm/pipelines";
import { moveDealStage } from "../actions";

export function StageBar({
  dealId,
  pipeline,
  stage,
}: {
  dealId: string;
  pipeline: PipelineId;
  stage: string;
}) {
  const stages = PIPELINES[pipeline].stages;
  const [current, setCurrent] = useState(stage);
  const [asking, setAsking] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const openStages = stages.filter((s) => s.outcome === "open");
  const currentIndex = openStages.findIndex((s) => s.id === current);

  function go(next: string, lostReason?: string) {
    if (next === current) return;
    const target = stages.find((s) => s.id === next);
    if (target?.outcome === "lost" && lostReason === undefined) {
      setAsking(next);
      setReason("");
      return;
    }
    setError(null);
    const before = current;
    setCurrent(next);
    start(async () => {
      const res = await moveDealStage(dealId, next, lostReason);
      if (!res.ok) {
        setCurrent(before);
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <ol className="flex flex-wrap gap-1.5" aria-label="Deal stage">
        {stages.map((s) => {
          const active = s.id === current;
          const passed =
            s.outcome === "open" &&
            currentIndex > -1 &&
            openStages.findIndex((o) => o.id === s.id) < currentIndex;
          return (
            <li key={s.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => go(s.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold whitespace-nowrap transition-colors disabled:cursor-wait",
                  active && s.outcome === "won" && "bg-emerald-600 text-white",
                  active && s.outcome === "lost" && "bg-slate-600 text-white",
                  active && s.outcome === "open" && "bg-brand-700 text-white",
                  !active &&
                    passed &&
                    "bg-brand-100 text-brand-800 hover:bg-brand-200",
                  !active &&
                    !passed &&
                    "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {passed && <Check aria-hidden className="size-3.5" />}
                {active && pending && (
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                )}
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
      {asking && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-[#ece9f5] bg-[#fbfaff] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const next = asking;
            setAsking(null);
            go(next, reason);
          }}
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="lost-reason"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Why was it lost? (optional)
            </label>
            <input
              id="lost-reason"
              autoFocus
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Budget moved to next year"
              className="focus:border-brand-400 focus:ring-brand-100 h-10 w-full rounded-lg border border-[#e4e0f0] bg-white px-3 text-sm outline-none focus:ring-3"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-700 hover:bg-brand-800 h-10 rounded-lg px-4 text-sm font-semibold text-white"
          >
            Mark as lost
          </button>
          <button
            type="button"
            onClick={() => setAsking(null)}
            className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white"
          >
            Cancel
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
