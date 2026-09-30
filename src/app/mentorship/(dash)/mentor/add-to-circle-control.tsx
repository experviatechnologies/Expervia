"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addAcceptedMenteeToCircle,
  startCircleWithMentee,
} from "../circles/actions";

/**
 * On the mentor dashboard, place an accepted 1:1 mentee into a Circle: either a
 * new one (creates a draft and takes the mentor there) or an existing draft/
 * active Circle.
 */
export function AddToCircleControl({
  menteeId,
  circles,
}: {
  menteeId: string;
  circles: { id: string; title: string | null }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("new");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span className="text-mnt-green text-[13px] font-semibold">
        Added to Circle
      </span>
    );
  }

  function submit() {
    setError(null);
    start(async () => {
      if (value === "new") {
        const res = await startCircleWithMentee({ menteeId });
        if ("error" in res) {
          setError(res.error);
          return;
        }
        router.push(`/mentorship/circles/${res.circleId}`);
      } else {
        const res = await addAcceptedMenteeToCircle({
          menteeId,
          circleId: value,
        });
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setDone(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Choose a Circle"
          className="border-mnt-line bg-mnt-panel-2 text-mnt-ink rounded-[8px] border px-2.5 py-1.5 text-[13px] outline-none"
        >
          <option value="new">+ New Circle</option>
          {circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title ?? "Circle"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-mnt-brand text-mnt-on-brand rounded-full px-3.5 py-1.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "…" : "Add"}
        </button>
      </div>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </div>
  );
}
