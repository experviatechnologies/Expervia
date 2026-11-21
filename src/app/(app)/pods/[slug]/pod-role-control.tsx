"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setPodRole } from "../actions";

type PodRole = "member" | "lead" | "co_lead";

/** Ops-only inline selector for a roster member's pod role. */
export function PodRoleControl({
  podId,
  memberId,
  role,
}: {
  podId: string;
  memberId: string;
  role: PodRole;
}) {
  const router = useRouter();
  const [value, setValue] = useState<PodRole>(role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: PodRole) {
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await setPodRole({ podId, memberId, role: next });
      if ("error" in res) {
        setError(res.error);
        setValue(prev);
      } else {
        // Another member may have been moved out of the slot; reload the roster.
        router.refresh();
      }
    });
  }

  return (
    <span className="flex items-center gap-1.5">
      {pending && <Loader2 className="text-eten-faint size-3.5 animate-spin" />}
      <select
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value as PodRole)}
        aria-label="Pod role"
        className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent rounded-lg border px-2 py-1 text-xs outline-none disabled:opacity-60"
      >
        <option value="member">Member</option>
        <option value="lead">Pod Leader</option>
        <option value="co_lead">Backup leader</option>
      </select>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
}
