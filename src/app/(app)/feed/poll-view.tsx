"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import type { PollData } from "@/lib/eten/polls";
import { votePoll } from "./actions";

/**
 * Renders a poll: each option is a clickable bar showing its share of the vote.
 * Clicking your current choice retracts it; clicking another moves your vote.
 */
export function PollView({ postId, poll }: { postId: string; poll: PollData }) {
  const [pending, startTransition] = useTransition();
  const { options, totalVotes, myOptionId } = poll;

  function vote(optionId: string) {
    startTransition(async () => {
      await votePoll({ postId, optionId });
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((o) => {
        const pct =
          totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0;
        const mine = myOptionId === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={pending}
            onClick={() => vote(o.id)}
            aria-pressed={mine}
            className={
              mine
                ? "border-primary/50 relative w-full overflow-hidden rounded-lg border text-left disabled:opacity-70"
                : "border-outline-variant hover:border-outline relative w-full overflow-hidden rounded-lg border text-left transition-colors disabled:opacity-70"
            }
          >
            <span
              className={
                mine
                  ? "bg-primary/20 absolute inset-y-0 left-0"
                  : "bg-surface-container absolute inset-y-0 left-0"
              }
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <span className="relative flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="text-on-surface flex items-center gap-1.5">
                {mine && <Check className="text-primary size-3.5" />}
                {o.label}
              </span>
              <span className="text-on-surface-variant text-xs">{pct}%</span>
            </span>
          </button>
        );
      })}
      <p className="text-on-surface-variant/70 text-xs">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"} · tap to
        {myOptionId ? " change or retract" : " vote"}
      </p>
    </div>
  );
}
