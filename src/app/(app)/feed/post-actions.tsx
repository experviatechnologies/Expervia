"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2, Trash2 } from "lucide-react";
import { reportContent, setPostRemoved } from "./actions";

/**
 * Compact Report / Delete controls for a post. Delete shows only to the author
 * or ops (canRemove); Report shows to everyone else. Reporting reveals an inline
 * reason box rather than a browser prompt.
 */
export function PostActions({
  postId,
  canRemove,
  isAuthor,
}: {
  postId: string;
  canRemove: boolean;
  isAuthor: boolean;
}) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitReport() {
    setError(null);
    startTransition(async () => {
      const res = await reportContent({
        targetType: "post",
        targetId: postId,
        reason,
      });
      if ("error" in res) setError(res.error);
      else {
        setReporting(false);
        setReason("");
        setMessage("Thanks — reported to the moderators.");
      }
    });
  }

  function remove() {
    if (
      !window.confirm(
        isAuthor
          ? "Delete this post? It will be removed from the feed."
          : "Remove this post from the feed?",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await setPostRemoved({ postId, removed: true });
      if ("error" in res) setError(res.error);
    });
  }

  if (message) {
    return <span className="text-eten-faint text-xs">{message}</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {!isAuthor && (
          <button
            type="button"
            onClick={() => setReporting((v) => !v)}
            className="text-eten-faint hover:text-eten-ink inline-flex items-center gap-1.5 text-xs"
          >
            <Flag className="size-3.5" />
            Report
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-eten-faint hover:text-destructive inline-flex items-center gap-1.5 text-xs disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {isAuthor ? "Delete" : "Remove"}
          </button>
        )}
      </div>

      {reporting && (
        <div className="flex w-full max-w-xs flex-col items-end gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            autoFocus
            placeholder="What's wrong with this post?"
            className="border-eten-line bg-eten-panel-hi text-eten-ink placeholder:text-eten-faint focus:border-eten-accent w-full resize-y rounded-lg border p-2 text-xs outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReporting(false)}
              className="text-eten-faint hover:text-eten-ink text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={pending || reason.trim().length === 0}
              className="bg-eten-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              Submit report
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
