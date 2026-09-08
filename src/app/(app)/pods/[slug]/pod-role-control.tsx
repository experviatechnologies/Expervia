"use client";

import { useState, useTransition } from "react";
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
      }
    });
  }

  return (
    <span className="flex items-center gap-1.5">
      {pending && (
        <Loader2 className="text-on-surface-variant size-3.5 animate-spin" />
      )}
      <select
        value={value}
        disabled={pending}
        onChange={(e) => change(e.target.value as PodRole)}
        aria-label="Pod role"
        className="border-outline-variant bg-surface text-on-surface focus:border-primary rounded-lg border px-2 py-1 text-xs outline-none disabled:opacity-60"
      >
        <option value="member">Member</option>
        <option value="lead">Lead</option>
        <option value="co_lead">Co-lead</option>
      </select>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
}
