"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { V_LEVELS } from "@/lib/eten/v-levels";
import { setCircleGoal } from "@/app/(app)/circles/actions";

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-3 text-sm text-eten-ink outline-none focus:border-eten-accent";
const labelClass = "text-label-sm text-eten-ink-muted font-mono uppercase";

/** A mentee sets/updates their goal for this Circle. */
export function SetGoalControl({
  circleId,
  currentVLevel,
  currentCapability,
}: {
  circleId: string;
  currentVLevel: number | null;
  currentCapability: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await setCircleGoal({
        circleId,
        targetVLevel: Number(fd.get("targetVLevel")),
        targetCapability: String(fd.get("targetCapability") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <section className="bg-eten-panel border-eten-accent/30 mt-6 rounded-2xl border p-6">
      <h2 className="font-display text-body-lg text-eten-ink mb-1 inline-flex items-center gap-2 font-bold">
        <Target className="text-eten-accent size-5" />
        Your goal
      </h2>
      <p className="text-eten-ink-muted mb-4 text-sm">
        Set the readiness level and capability you&apos;re working toward in
        this Circle. Your mentor and Pod Leader see this.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="targetVLevel" className={labelClass}>
            Target V-level
          </label>
          <select
            id="targetVLevel"
            name="targetVLevel"
            required
            defaultValue={currentVLevel ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose a level…
            </option>
            {V_LEVELS.map((v) => (
              <option key={v.level} value={v.level}>
                V{v.level} · {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="targetCapability" className={labelClass}>
            Capability area
          </label>
          <input
            id="targetCapability"
            name="targetCapability"
            required
            maxLength={160}
            defaultValue={currentCapability ?? ""}
            placeholder="e.g. Azure landing-zone design"
            className={fieldClass}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="eten"
            size="pill-sm"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : currentVLevel != null ? (
              "Update goal"
            ) : (
              "Set goal"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
