"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewSubmission } from "@/app/(app)/circles/actions";

/** Mentor / lead controls to approve or request revision on a submission. */
export function ReviewSubmissionControl({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "approved" | "needs_revision") {
    setError(null);
    startTransition(async () => {
      const res = await reviewSubmission({ submissionId, decision, note });
      if ("error" in res) setError(res.error);
      else {
        setRevising(false);
        setNote("");
        router.refresh();
      }
    });
  }

  if (revising) {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What needs revising? (shown to the mentee)"
          className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent w-full rounded-lg border p-2 text-sm outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            disabled={pending}
            onClick={() => setRevising(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            disabled={pending}
            onClick={() => decide("needs_revision")}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Send back
          </Button>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          disabled={pending}
          onClick={() => setRevising(true)}
        >
          <RotateCcw className="size-3.5" />
          Request revision
        </Button>
        <Button
          type="button"
          variant="eten"
          size="sm"
          disabled={pending}
          onClick={() => decide("approved")}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Approve
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
