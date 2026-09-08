"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { blockMember, unblockMember } from "../../settings/actions";

export function BlockButton({
  memberId,
  initialBlocked,
}: {
  memberId: string;
  initialBlocked: boolean;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!blocked && !window.confirm("Block this member?")) return;
    setError(null);
    startTransition(async () => {
      const res = blocked
        ? await unblockMember({ memberId })
        : await blockMember({ memberId });
      if ("error" in res) setError(res.error);
      else {
        setBlocked(!blocked);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="text-on-surface-variant hover:text-destructive inline-flex items-center gap-1.5 text-xs disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Ban className="size-3.5" />
        )}
        {blocked ? "Unblock" : "Block"}
      </button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
