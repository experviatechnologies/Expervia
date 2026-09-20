"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeCircle } from "@/app/(app)/circles/actions";

/** Mentor / lead / ops control to complete an active Circle. */
export function CompleteCircleControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function complete() {
    setError(null);
    startTransition(async () => {
      const res = await completeCircle({ circleId });
      if ("error" in res) setError(res.error);
      else {
        setConfirming(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-eten-ink-muted text-sm">
            Complete this Circle? Mentees who met the threshold are graduated
            and recognised. This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="etenOutline"
              size="sm"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="eten"
              size="sm"
              disabled={pending}
              onClick={complete}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Confirm complete
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="etenOutline"
          size="pill-sm"
          onClick={() => setConfirming(true)}
        >
          <CheckCircle2 className="size-4" />
          Complete Circle
        </Button>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
