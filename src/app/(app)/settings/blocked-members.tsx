"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unblockMember } from "./actions";

export type BlockedRow = { memberId: string; name: string };

export function BlockedMembers({ blocked }: { blocked: BlockedRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (blocked.length === 0) {
    return (
      <p className="text-eten-ink-muted text-sm">
        You haven&apos;t blocked anyone.
      </p>
    );
  }

  function unblock(memberId: string) {
    setError(null);
    setBusyId(memberId);
    startTransition(async () => {
      const res = await unblockMember({ memberId });
      if ("error" in res) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {blocked.map((b) => (
        <div
          key={b.memberId}
          className="flex items-center justify-between gap-3 rounded-lg py-1"
        >
          <Link
            href={`/members/${b.memberId}`}
            className="text-eten-ink text-sm font-medium hover:underline"
          >
            {b.name}
          </Link>
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            disabled={pending}
            onClick={() => unblock(b.memberId)}
          >
            {pending && busyId === b.memberId ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Unblock"
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
