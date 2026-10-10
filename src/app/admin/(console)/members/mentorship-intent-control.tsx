"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setMentorshipIntent } from "./actions";

/** Ops control to switch a member's mentorship role (mentee ↔ mentor). */
export function MentorshipIntentControl({
  memberId,
  intent,
}: {
  memberId: string;
  intent: "mentee" | "mentor";
}) {
  const router = useRouter();
  const [value, setValue] = useState<"mentee" | "mentor">(intent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: "mentee" | "mentor") {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await setMentorshipIntent({ memberId, intent: next });
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
          onChange={(e) => change(e.target.value as "mentee" | "mentor")}
          aria-label="Mentorship role"
          className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent rounded-lg border px-2 py-1 text-sm outline-none disabled:opacity-60"
        >
          <option value="mentee">Mentee</option>
          <option value="mentor">Mentor</option>
        </select>
        {pending && <Loader2 className="text-eten-faint size-4 animate-spin" />}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
