"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { V_LEVELS } from "@/lib/eten/v-levels";
import { enrolMentee, setCircleGoal, activateCircle } from "../actions";

const field =
  "border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand w-full rounded-[10px] border px-3.5 py-2.5 text-[14px] outline-none";
const btn =
  "bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60";

/** Mentor: activate a draft Circle. */
export function ActivateCircleControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-4">
      <button
        type="button"
        className={btn}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await activateCircle({ circleId });
            if ("error" in res) setError(res.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Activating…" : "Activate Circle"}
      </button>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </div>
  );
}

/** Mentor: enrol a mentee by email. */
export function EnrolMenteeControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mentee@email.com"
          className={field + " max-w-[260px] flex-1"}
        />
        <button
          type="button"
          className={btn}
          disabled={pending || !email.trim()}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await enrolMentee({ circleId, email });
              if ("error" in res) setError(res.error);
              else {
                setEmail("");
                router.refresh();
              }
            })
          }
        >
          {pending ? "Adding…" : "Add mentee"}
        </button>
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
    </div>
  );
}

/** Mentee: set or update their goal. */
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
    startTransition(async () => {
      setError(null);
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
    <form
      onSubmit={handleSubmit}
      className="bg-mnt-panel border-mnt-brand/30 mt-[18px] rounded-2xl border p-[18px]"
    >
      <div className="text-mnt-ink font-display text-[15px] font-bold">
        Your goal
      </div>
      <p className="text-mnt-ink-muted mt-1 text-[12.5px]">
        The readiness level and capability you are working toward. Your mentor
        sees this.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select
          name="targetVLevel"
          required
          defaultValue={currentVLevel ?? ""}
          className={field}
        >
          <option value="" disabled>
            Target V-level…
          </option>
          {V_LEVELS.map((v) => (
            <option key={v.level} value={v.level}>
              V{v.level} · {v.label}
            </option>
          ))}
        </select>
        <input
          name="targetCapability"
          maxLength={160}
          defaultValue={currentCapability ?? ""}
          placeholder="e.g. Azure landing-zone design"
          className={field}
        />
      </div>
      {error && <p className="text-destructive mt-2 text-[12px]">{error}</p>}
      <div className="mt-3">
        <button type="submit" className={btn} disabled={pending}>
          {pending ? "Saving…" : "Save goal"}
        </button>
      </div>
    </form>
  );
}
