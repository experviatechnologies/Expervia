"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinPod, leavePod } from "../actions";

/**
 * Join / Leave control for the pod detail header. The primary pod renders as a
 * static "Primary pod" label instead (handled by the page), so this button only
 * appears for non-primary pods.
 */
export function PodMembershipButton({
  podId,
  isMember,
}: {
  podId: string;
  isMember: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = isMember
        ? await leavePod({ podId })
        : await joinPod({ podId });
      if ("error" in res) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        type="button"
        variant={isMember ? "brandOutline" : "brand"}
        size="pill-sm"
        disabled={pending}
        onClick={toggle}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isMember ? (
          "Leave pod"
        ) : (
          "Join pod"
        )}
      </Button>
      {error && <p className="text-destructive max-w-xs text-xs">{error}</p>}
    </div>
  );
}
