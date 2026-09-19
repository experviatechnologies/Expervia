"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitEvidence } from "@/app/(app)/circles/actions";

type SubmissionStatus = "submitted" | "approved" | "needs_revision";

/** A mentee submits / resubmits evidence for one assignment. */
export function SubmitEvidenceControl({
  assignmentId,
  status,
  content,
  reviewNote,
}: {
  assignmentId: string;
  status: SubmissionStatus | null;
  content: string | null;
  reviewNote: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await submitEvidence({
        assignmentId,
        content: String(fd.get("content") ?? ""),
      });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  if (status === "approved") {
    return (
      <div className="border-eten-verified/30 bg-eten-verified-soft text-eten-verified mt-3 flex items-center gap-2 rounded-lg border p-3 text-sm">
        <BadgeCheck className="size-4" />
        Approved — added to your capability passport.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      {status === "needs_revision" && reviewNote && (
        <p className="border-eten-line bg-eten-panel-hi text-eten-ink-muted rounded-lg border p-2 text-xs">
          <span className="text-eten-ink font-semibold">
            Revision requested:
          </span>{" "}
          {reviewNote}
        </p>
      )}
      <textarea
        name="content"
        rows={3}
        required
        defaultValue={content ?? ""}
        placeholder="Your evidence — describe what you did, or paste a link."
        className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent w-full rounded-lg border p-2.5 text-sm outline-none"
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="text-eten-faint text-xs">
          {status === "submitted"
            ? "Submitted — awaiting your mentor's review."
            : status === "needs_revision"
              ? "Needs revision."
              : "Not submitted yet."}
        </span>
        <Button type="submit" variant="eten" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : status ? (
            "Resubmit"
          ) : (
            "Submit evidence"
          )}
        </Button>
      </div>
    </form>
  );
}
