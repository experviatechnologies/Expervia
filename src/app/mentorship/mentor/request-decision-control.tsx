"use client";

import { useState, useTransition } from "react";
import { decideMentorshipRequest } from "../mentors/actions";

export function RequestDecisionControl({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<null | "accepted" | "declined">(null);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span
        className={
          "text-[13px] font-semibold " +
          (done === "accepted" ? "text-mnt-green" : "text-mnt-faint")
        }
      >
        {done === "accepted" ? "Accepted" : "Declined"}
      </span>
    );
  }

  function decide(decision: "accepted" | "declined") {
    setError(null);
    start(async () => {
      const res = await decideMentorshipRequest({ requestId, decision });
      if ("error" in res) setError(res.error);
      else setDone(decision);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => decide("accepted")}
          disabled={pending}
          className="bg-mnt-brand text-mnt-on-brand rounded-full px-3.5 py-1.5 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => decide("declined")}
          disabled={pending}
          className="border-mnt-line text-mnt-ink-muted hover:text-mnt-ink rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </div>
  );
}
