"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nominateMentor } from "../actions";

/** Pod-Leader control to nominate a pod member as a Mentor Candidate. */
export function NominateMentorButton({
  podId,
  memberId,
}: {
  podId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function nominate() {
    setError(null);
    startTransition(async () => {
      const res = await nominateMentor({ podId, memberId });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="etenOutline"
        size="sm"
        disabled={pending}
        onClick={nominate}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <GraduationCap className="size-3.5" />
        )}
        Nominate as mentor
      </Button>
      {error && (
        <span className="text-destructive max-w-[180px] text-xs">{error}</span>
      )}
    </span>
  );
}
