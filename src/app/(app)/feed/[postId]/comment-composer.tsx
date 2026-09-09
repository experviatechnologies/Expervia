"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addComment } from "../actions";

/**
 * Reusable comment box — the top-level composer on the post, and the inline
 * reply box under a comment (pass parentCommentId + onDone).
 */
export function CommentComposer({
  postId,
  parentCommentId,
  placeholder = "Add a comment…",
  autoFocus = false,
  onDone,
}: {
  postId: string;
  parentCommentId?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addComment({
        postId,
        body,
        parentCommentId: parentCommentId ?? null,
      });
      if ("error" in res) setError(res.error);
      else {
        setBody("");
        onDone?.();
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentCommentId ? 2 : 3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="border-eten-line bg-eten-panel-hi text-eten-ink placeholder:text-eten-faint focus:border-eten-accent w-full resize-y rounded-lg border p-3 text-sm outline-none"
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onDone && (
          <Button
            type="button"
            variant="ghost"
            size="pill-sm"
            disabled={pending}
            onClick={onDone}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="eten"
          size="pill-sm"
          disabled={pending || body.trim().length === 0}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {parentCommentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
