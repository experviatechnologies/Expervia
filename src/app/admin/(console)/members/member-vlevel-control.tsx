"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { V_LEVELS } from "@/lib/eten/v-levels";
import { setMemberVLevel } from "./actions";

/** Ops control to set a member's ETEN readiness level (V0–V5). */
export function MemberVLevelControl({
  memberId,
  vLevel,
}: {
  memberId: string;
  vLevel: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(vLevel);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: number) {
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await setMemberVLevel({ memberId, vLevel: next });
      if ("error" in res) {
        setError(res.error);
        setValue(prev);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={value}
          disabled={pending}
          onChange={(e) => change(Number(e.target.value))}
          aria-label="Readiness level"
          className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent rounded-lg border px-2 py-1 text-sm outline-none disabled:opacity-60"
        >
          {V_LEVELS.map((v) => (
            <option key={v.level} value={v.level}>
              V{v.level} · {v.label}
            </option>
          ))}
        </select>
        {pending && <Loader2 className="text-eten-faint size-4 animate-spin" />}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
