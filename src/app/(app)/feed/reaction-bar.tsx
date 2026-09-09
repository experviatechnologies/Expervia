"use client";

import { useState, useTransition } from "react";
import {
  REACTION_TYPES,
  type ReactionCounts,
  type ReactionType,
} from "@/lib/eten/reactions";
import { toggleReaction } from "./actions";

/**
 * Row of the four reaction buttons for a post or comment. Optimistic-ish: the
 * server action revalidates, but we track the pending target so the tapped
 * button reads as busy.
 */
export function ReactionBar({
  targetType,
  targetId,
  postId,
  counts,
  mine,
}: {
  targetType: "post" | "comment";
  targetId: string;
  postId: string;
  counts: ReactionCounts;
  mine: ReactionType | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function react(reactionType: ReactionType) {
    setError(null);
    startTransition(async () => {
      const res = await toggleReaction({
        targetType,
        targetId,
        reactionType,
        postId,
      });
      if ("error" in res) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {REACTION_TYPES.map(({ type, emoji, label }) => {
          const count = counts[type];
          const active = mine === type;
          return (
            <button
              key={type}
              type="button"
              aria-label={label}
              aria-pressed={active}
              title={label}
              disabled={pending}
              onClick={() => react(type)}
              className={
                active
                  ? "border-eten-accent/50 bg-eten-accent-soft inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-[#cddcfb] transition-colors disabled:opacity-60"
                  : "border-eten-line text-eten-ink-muted hover:text-eten-ink hover:border-eten-faint inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-60"
              }
            >
              <span aria-hidden>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
