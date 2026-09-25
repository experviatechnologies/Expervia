"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCircle } from "../actions";

const inputClass =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand mt-1.5 w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors";
const labelClass = "text-mnt-ink-muted text-[12.5px] font-medium";

export default function NewCirclePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCircle({
        title: String(fd.get("title") ?? ""),
        cadence: fd.get("cadence") === "biweekly" ? "biweekly" : "weekly",
        startDate: String(fd.get("startDate") ?? ""),
        endDate: String(fd.get("endDate") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else router.push(`/mentorship/circles/${res.circleId}`);
    });
  }

  return (
    <div className="mx-auto max-w-[560px] px-6 py-12">
      <Link
        href="/mentorship/mentor"
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← Back
      </Link>
      <h1 className="font-display mt-3 text-2xl font-extrabold">
        Create a Circle
      </h1>
      <p className="text-mnt-ink-muted mt-2 text-[14px]">
        Start a Circle in your capability area. You will add mentees and set the
        schedule next.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-mnt-panel border-mnt-line mt-6 rounded-2xl border p-6"
      >
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          className={inputClass}
          placeholder="Cloud Security Circle"
        />

        <div className="mt-3.5">
          <label htmlFor="cadence" className={labelClass}>
            Cadence
          </label>
          <select id="cadence" name="cadence" className={inputClass}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
          </select>
        </div>

        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={labelClass}>
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>
              End date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-destructive mt-4 text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-mnt-brand text-mnt-on-brand mt-6 w-full rounded-[11px] py-3.5 text-[15px] font-bold transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create Circle"}
        </button>
      </form>
    </div>
  );
}
