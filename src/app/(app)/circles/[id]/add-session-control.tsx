"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/app/(app)/circles/actions";

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-2.5 text-sm text-eten-ink outline-none focus:border-eten-accent";

/** Mentor / lead control to log a session. */
export function AddSessionControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await addSession({
        circleId,
        sessionDate: String(fd.get("sessionDate") ?? ""),
        title: String(fd.get("title") ?? ""),
        notes: String(fd.get("notes") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="etenOutline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        Log a session
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-eten-line bg-eten-panel-hi flex flex-col gap-3 rounded-xl border p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="date" name="sessionDate" className={fieldClass} />
        <input
          name="title"
          maxLength={160}
          placeholder="Topic (optional)"
          className={fieldClass}
        />
      </div>
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes (optional)"
        className={fieldClass}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="eten" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Add session"
          )}
        </Button>
      </div>
    </form>
  );
}
