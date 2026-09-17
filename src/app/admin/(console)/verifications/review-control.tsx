"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewVerification } from "./actions";

/** Approve / reject controls for one pending verification submission. */
export function ReviewControl({ id }: { id: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(status: "verified" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await reviewVerification({ id, status, note });
      if ("error" in res) setError(res.error);
      else {
        setRejecting(false);
        setNote("");
        router.refresh();
      }
    });
  }

  if (rejecting) {
    return (
      <div className="flex flex-col items-end gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Reason (shown to the member)…"
          className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent w-full min-w-[220px] rounded-lg border p-2 text-sm outline-none"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            disabled={pending}
            onClick={() => setRejecting(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => submit("rejected")}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            Confirm reject
          </Button>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          disabled={pending}
          onClick={() => setRejecting(true)}
        >
          <X className="size-3.5" />
          Reject
        </Button>
        <Button
          type="button"
          variant="eten"
          size="sm"
          disabled={pending}
          onClick={() => submit("verified")}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Verify
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
