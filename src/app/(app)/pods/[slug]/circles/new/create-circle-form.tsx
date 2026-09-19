"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCircle } from "@/app/(app)/circles/actions";

type Person = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-3 text-sm text-eten-ink outline-none focus:border-eten-accent";
const labelClass = "text-label-sm text-eten-ink-muted font-mono uppercase";

export function CreateCircleForm({
  podId,
  mentors,
  candidates,
}: {
  podId: string;
  mentors: Person[];
  candidates: Person[];
}) {
  const router = useRouter();
  const [mentorId, setMentorId] = useState("");
  const [mentees, setMentees] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const MAX = 10;

  function toggleMentee(id: string) {
    setMentees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX) next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!mentorId) {
      setError("Choose a Verified Mentor.");
      return;
    }
    const menteeIds = [...mentees].filter((id) => id !== mentorId);
    if (menteeIds.length === 0) {
      setError("Select at least one mentee.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createCircle({
        podId,
        mentorId,
        menteeIds,
        cadence: (fd.get("cadence") as "weekly" | "biweekly") ?? "weekly",
        startDate: String(fd.get("startDate") ?? ""),
        endDate: String(fd.get("endDate") ?? ""),
        title: String(fd.get("title") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else router.push(`/circles/${res.circleId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-eten-faint lowercase">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          placeholder="e.g. Data & AI — Autumn cohort"
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="mentor" className={labelClass}>
          Verified Mentor
        </label>
        {mentors.length === 0 ? (
          <p className="text-eten-faint text-sm">
            This pod has no Verified Mentors yet — nominate one first.
          </p>
        ) : (
          <select
            id="mentor"
            value={mentorId}
            onChange={(e) => {
              setMentorId(e.target.value);
              setMentees((prev) => {
                const next = new Set(prev);
                next.delete(e.target.value);
                return next;
              });
            }}
            className={fieldClass}
          >
            <option value="">Choose a mentor…</option>
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>
          Mentees{" "}
          <span className="text-eten-faint lowercase">
            ({mentees.size}/{MAX} selected)
          </span>
        </span>
        <div className="border-eten-line bg-eten-panel-hi flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
          {candidates.filter((c) => c.id !== mentorId).length === 0 ? (
            <p className="text-eten-faint p-2 text-sm">
              No eligible pod members.
            </p>
          ) : (
            candidates
              .filter((c) => c.id !== mentorId)
              .map((c) => {
                const on = mentees.has(c.id);
                const disabled = !on && mentees.size >= MAX;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleMentee(c.id)}
                    disabled={disabled}
                    className={
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors disabled:opacity-40 " +
                      (on
                        ? "bg-eten-accent-soft text-[#cddcfb]"
                        : "text-eten-ink-muted hover:bg-eten-hover")
                    }
                  >
                    <span
                      className={
                        "grid size-4 shrink-0 place-items-center rounded border " +
                        (on
                          ? "border-eten-accent bg-eten-accent text-white"
                          : "border-eten-line")
                      }
                    >
                      {on && <Check className="size-3" />}
                    </span>
                    {c.name}
                  </button>
                );
              })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="cadence" className={labelClass}>
            Cadence
          </label>
          <select
            id="cadence"
            name="cadence"
            defaultValue="weekly"
            className={fieldClass}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="startDate" className={labelClass}>
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="endDate" className={labelClass}>
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            className={fieldClass}
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="eten"
          size="pill-sm"
          disabled={pending || mentors.length === 0}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Circle"
          )}
        </Button>
      </div>
    </form>
  );
}
