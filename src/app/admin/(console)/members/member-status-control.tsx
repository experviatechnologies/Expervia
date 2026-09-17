"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, RotateCcw, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setMemberStatus } from "./actions";

type Status = "active" | "suspended" | "deactivated";

/** Status actions for a single member, used on the member detail page. */
export function MemberStatusControl({
  memberId,
  status,
  isOperations,
}: {
  memberId: string;
  status: Status;
  isOperations: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isOperations) {
    return (
      <span className="text-eten-faint/70 text-xs">
        Operations account — protected
      </span>
    );
  }

  function act(next: Status) {
    setError(null);
    startTransition(async () => {
      const res = await setMemberStatus({ memberId, status: next });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {pending && (
          <Loader2 className="text-eten-faint mt-1.5 size-4 animate-spin" />
        )}
        {status !== "active" && (
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            disabled={pending}
            onClick={() => act("active")}
          >
            <RotateCcw className="size-3.5" />
            Reactivate
          </Button>
        )}
        {status === "active" && (
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            disabled={pending}
            onClick={() => act("suspended")}
          >
            <Ban className="size-3.5" />
            Suspend
          </Button>
        )}
        {status !== "deactivated" && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => act("deactivated")}
          >
            <UserX className="size-3.5" />
            Deactivate
          </Button>
        )}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
