"use client";

/**
 * The two decisions for a flagged contact. Merging cannot be undone, so it
 * asks for a second click to confirm.
 */
import { useState, useTransition } from "react";
import { GitMerge, Loader2, UserX } from "lucide-react";
import { confirmSamePerson, markDifferentPeople } from "./actions";

export function DecisionButtons({
  contactId,
  canMerge,
  leadName,
  matchName,
}: {
  contactId: string;
  canMerge: boolean;
  leadName: string;
  matchName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(
    action: (id: string) => Promise<{ ok: boolean; error?: string }>,
  ) {
    setError(null);
    start(async () => {
      const res = await action(contactId);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        setConfirming(false);
      }
    });
  }

  const btn =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div>
      {confirming ? (
        <div
          role="alertdialog"
          aria-label="Confirm merge"
          className="border-brand-200 bg-brand-50 rounded-xl border p-3 text-sm"
        >
          <p className="text-ink">
            Merge <span className="font-semibold">{leadName}</span> into{" "}
            <span className="font-semibold">{matchName}</span>? Their timeline
            and tags move across and their other email is kept. This can&apos;t
            be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              autoFocus
              disabled={pending}
              onClick={() => run(confirmSamePerson)}
              className={`${btn} bg-brand-700 hover:bg-brand-800 text-white`}
            >
              {pending && (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              )}
              Yes, merge them
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className={`${btn} text-ink hover:bg-brand-50 border border-[#e4e0f0] bg-white`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canMerge || pending}
            onClick={() => setConfirming(true)}
            title={
              canMerge ? undefined : "The matching account no longer exists"
            }
            className={`${btn} bg-brand-700 hover:bg-brand-800 text-white`}
          >
            <GitMerge aria-hidden className="size-4" />
            Same person, merge
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(markDifferentPeople)}
            className={`${btn} text-ink hover:border-brand-300 hover:bg-brand-50 border border-[#e4e0f0] bg-white`}
          >
            {pending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <UserX aria-hidden className="size-4" />
            )}
            Different people
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
