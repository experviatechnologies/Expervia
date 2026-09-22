"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMember } from "./actions";

/**
 * Permanently delete a member. Two-step: reveal a confirm box, then require the
 * operator to type the confirmation phrase (their email, or DELETE if none)
 * before the button arms. On success, returns to the members list.
 */
export function DeleteMemberControl({
  memberId,
  email,
  isOperations,
}: {
  memberId: string;
  email: string | null;
  isOperations: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isOperations) {
    return (
      <span className="text-eten-faint/70 text-xs">
        Operations account — protected from deletion
      </span>
    );
  }

  const phrase = email || "DELETE";
  const armed = typed.trim().toLowerCase() === phrase.toLowerCase();

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteMember({ memberId });
      if ("error" in res) setError(res.error);
      else {
        router.push("/admin/members");
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5" />
        Delete permanently
      </Button>
    );
  }

  return (
    <div className="border-destructive/40 bg-destructive/5 flex w-full max-w-md flex-col gap-3 rounded-xl border p-4">
      <p className="text-eten-ink text-sm">
        This permanently erases the account and all of its data — profile, pods,
        posts, messages, evidence, and uploaded files. It cannot be undone.
      </p>
      <label className="text-eten-ink-muted text-xs">
        Type{" "}
        <span className="text-eten-ink font-mono font-semibold">{phrase}</span>{" "}
        to confirm
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-destructive mt-1.5 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          placeholder={phrase}
        />
      </label>
      {error && (
        <p className="text-destructive flex items-start gap-1.5 text-xs">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending || !armed}
          onClick={remove}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Delete this member
        </Button>
      </div>
    </div>
  );
}
