"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { registerPodLeaderAsMentor } from "./actions";

export function RegisterMentorControl({
  memberId,
  podId,
  areas,
  defaultAreaId,
}: {
  memberId: string;
  podId: string;
  areas: { id: string; label: string }[];
  defaultAreaId: string;
}) {
  const [areaId, setAreaId] = useState(defaultAreaId);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span className="text-eten-verified inline-flex items-center gap-1 text-xs font-medium">
        <Check className="size-3.5" />
        Registered
      </span>
    );
  }

  function register() {
    setError(null);
    start(async () => {
      const res = await registerPodLeaderAsMentor({
        memberId,
        capabilityAreaId: areaId,
        podId,
      });
      if ("error" in res) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="border-eten-line bg-eten-panel text-eten-ink rounded-lg border px-2 py-1.5 text-xs outline-none"
          aria-label="Capability area"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={register}
          disabled={pending || !areaId}
          className="bg-eten-accent rounded-full px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "…" : "Register"}
        </button>
      </div>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </div>
  );
}
