"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activateCircle } from "@/app/(app)/circles/actions";

/** Mentor / pod-lead / ops control to activate a draft Circle. */
export function ActivateCircleControl({
  circleId,
  allGoalsSet,
}: {
  circleId: string;
  allGoalsSet: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function activate() {
    setError(null);
    startTransition(async () => {
      const res = await activateCircle({ circleId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="eten"
        size="pill-sm"
        disabled={pending || !allGoalsSet}
        onClick={activate}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Activate Circle
      </Button>
      {!allGoalsSet && (
        <p className="text-eten-faint text-xs">
          Every mentee must set a goal before you can activate.
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
