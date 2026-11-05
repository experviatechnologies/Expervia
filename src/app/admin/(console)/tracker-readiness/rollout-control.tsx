"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setRollout } from "./actions";

type Stage = "staff" | "pilot" | "everyone";

const STAGES: { id: Stage; label: string; help: string }[] = [
  {
    id: "staff",
    label: "Staff only",
    help: "No weekly availability emails to engineers. Use before launch.",
  },
  {
    id: "pilot",
    label: "Pilot pods",
    help: "Weekly availability emails go only to engineers in the pods ticked below.",
  },
  {
    id: "everyone",
    label: "Everyone",
    help: "Every opted-in engineer gets the weekly availability email.",
  },
];

/** Admin control for the tracker's launch waves (Phase 9, step 9.3). */
export function RolloutControl({
  stage,
  pilotPodIds,
  pods,
  totalEngineers,
}: {
  stage: Stage;
  pilotPodIds: string[];
  pods: { id: string; name: string; memberIds: string[] }[];
  totalEngineers: number;
}) {
  const router = useRouter();
  const [next, setNext] = useState<Stage>(stage);
  const [picked, setPicked] = useState<string[]>(pilotPodIds);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const changed =
    next !== stage ||
    picked.length !== pilotPodIds.length ||
    picked.some((p) => !pilotPodIds.includes(p));
  // Distinct people: an engineer in two pilot pods counts once.
  const reach =
    next === "staff"
      ? 0
      : next === "everyone"
        ? totalEngineers
        : new Set(
            pods
              .filter((p) => picked.includes(p.id))
              .flatMap((p) => p.memberIds),
          ).size;

  return (
    <div className="space-y-4">
      <fieldset className="grid gap-2 md:grid-cols-3">
        <legend className="sr-only">Rollout stage</legend>
        {STAGES.map((s) => (
          <label
            key={s.id}
            className={
              "flex cursor-pointer gap-2.5 rounded-xl border p-3 " +
              (next === s.id
                ? "border-eten-accent/50 bg-eten-accent-soft"
                : "border-eten-line bg-eten-panel")
            }
          >
            <input
              type="radio"
              name="rollout-stage"
              value={s.id}
              checked={next === s.id}
              onChange={() => setNext(s.id)}
              className="mt-1"
            />
            <span>
              <span className="text-eten-ink block text-sm font-semibold">
                {s.label}
                {stage === s.id && (
                  <span className="text-eten-faint ml-1.5 text-xs font-normal">
                    (current)
                  </span>
                )}
              </span>
              <span className="text-eten-faint block text-xs">{s.help}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {next === "pilot" && (
        <fieldset className="bg-eten-panel border-eten-line rounded-xl border p-3">
          <legend className="text-eten-ink px-1 text-sm font-semibold">
            Pilot pods
          </legend>
          <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3">
            {pods.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.includes(p.id)}
                  onChange={(e) =>
                    setPicked(
                      e.target.checked
                        ? [...picked, p.id]
                        : picked.filter((x) => x !== p.id),
                    )
                  }
                />
                <span className="text-eten-ink">{p.name}</span>
                <span className="text-eten-faint text-xs tabular-nums">
                  {p.memberIds.length}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !changed}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const res = await setRollout({
                stage: next,
                pilotPodIds: next === "pilot" ? picked : [],
              });
              setMsg("error" in res ? res.error : "Saved.");
              router.refresh();
            })
          }
          className="bg-eten-accent inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save rollout
        </button>
        <span className="text-eten-faint text-xs">
          About {reach} engineer{reach === 1 ? "" : "s"} in reach of the weekly
          email (only those whose availability is out of date get it).
        </span>
        {msg && (
          <span role="status" className="text-eten-ink-muted text-xs">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
