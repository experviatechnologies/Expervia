"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postAssignment } from "@/app/(app)/circles/actions";

const fieldClass =
  "w-full rounded-lg border border-eten-line bg-eten-panel-hi p-2.5 text-sm text-eten-ink outline-none focus:border-eten-accent";

/** Mentor / lead control to post an assignment. */
export function PostAssignmentControl({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await postAssignment({
        circleId,
        title: String(fd.get("title") ?? ""),
        instructions: String(fd.get("instructions") ?? ""),
        dueDate: String(fd.get("dueDate") ?? ""),
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
        Post assignment
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-eten-line bg-eten-panel-hi flex flex-col gap-3 rounded-xl border p-4"
    >
      <input
        name="title"
        required
        maxLength={200}
        placeholder="Assignment title"
        className={fieldClass}
      />
      <textarea
        name="instructions"
        rows={3}
        placeholder="Instructions (optional)"
        className={fieldClass}
      />
      <label className="text-eten-faint text-xs">
        Due date (optional)
        <input type="date" name="dueDate" className={fieldClass + " mt-1"} />
      </label>
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
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Post"}
        </Button>
      </div>
    </form>
  );
}
