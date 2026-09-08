"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Flag, Loader2, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/time";
import type { ReactionCounts, ReactionType } from "@/lib/eten/reactions";
import { reportContent, setCommentRemoved } from "../actions";
import { ReactionBar } from "../reaction-bar";
import { CommentComposer } from "./comment-composer";

export type CommentNode = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies: CommentNode[];
  reactionCounts: ReactionCounts;
  myReaction: ReactionType | null;
};

export function CommentsThread({
  postId,
  comments,
  viewerId,
  isOps,
}: {
  postId: string;
  comments: CommentNode[];
  viewerId: string;
  isOps: boolean;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-on-surface-variant py-4 text-sm">
        No comments yet. Start the conversation.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {comments.map((c) => (
        <li key={c.id}>
          <CommentItem
            postId={postId}
            comment={c}
            canReply
            viewerId={viewerId}
            isOps={isOps}
          />
          {c.replies.length > 0 && (
            <ul className="border-outline-variant/50 mt-4 flex flex-col gap-4 border-l pl-4">
              {c.replies.map((r) => (
                <li key={r.id}>
                  <CommentItem
                    postId={postId}
                    comment={r}
                    canReply={false}
                    viewerId={viewerId}
                    isOps={isOps}
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function CommentItem({
  postId,
  comment,
  canReply,
  viewerId,
  isOps,
}: {
  postId: string;
  comment: CommentNode;
  canReply: boolean;
  viewerId: string;
  isOps: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const isAuthor = comment.authorId === viewerId;
  const canRemove = isAuthor || isOps;

  return (
    <div className="flex gap-3">
      <Link
        href={`/members/${comment.authorId}`}
        className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      >
        {comment.authorName.trim().charAt(0).toUpperCase()}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-sm">
          <Link
            href={`/members/${comment.authorId}`}
            className="text-on-surface font-medium hover:underline"
          >
            {comment.authorName}
          </Link>
          <span className="text-on-surface-variant text-xs">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="text-on-surface mt-1 text-sm whitespace-pre-line">
          {comment.body}
        </p>

        <div className="mt-2">
          <ReactionBar
            targetType="comment"
            targetId={comment.id}
            postId={postId}
            counts={comment.reactionCounts}
            mine={comment.myReaction}
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          {canReply && !replying && (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="text-on-surface-variant hover:text-on-surface text-xs font-medium"
            >
              Reply
            </button>
          )}
          <CommentActions
            postId={postId}
            commentId={comment.id}
            canRemove={canRemove}
            isAuthor={isAuthor}
          />
        </div>

        {replying && (
          <div className="mt-3">
            <CommentComposer
              postId={postId}
              parentCommentId={comment.id}
              placeholder={`Reply to ${comment.authorName}…`}
              autoFocus
              onDone={() => setReplying(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CommentActions({
  postId,
  commentId,
  canRemove,
  isAuthor,
}: {
  postId: string;
  commentId: string;
  canRemove: boolean;
  isAuthor: boolean;
}) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitReport() {
    setError(null);
    startTransition(async () => {
      const res = await reportContent({
        targetType: "comment",
        targetId: commentId,
        reason,
      });
      if ("error" in res) setError(res.error);
      else {
        setReporting(false);
        setReason("");
        setDone("Reported");
      }
    });
  }

  function remove() {
    if (!window.confirm("Remove this comment?")) return;
    setError(null);
    startTransition(async () => {
      const res = await setCommentRemoved({
        commentId,
        postId,
        removed: true,
      });
      if ("error" in res) setError(res.error);
    });
  }

  if (done) {
    return <span className="text-on-surface-variant text-xs">{done}</span>;
  }

  return (
    <>
      {!isAuthor && (
        <button
          type="button"
          onClick={() => setReporting((v) => !v)}
          className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 text-xs"
        >
          <Flag className="size-3" />
          Report
        </button>
      )}
      {canRemove && (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-on-surface-variant hover:text-destructive inline-flex items-center gap-1 text-xs disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Trash2 className="size-3" />
          )}
          Delete
        </button>
      )}
      {reporting && (
        <span className="mt-2 flex w-full basis-full flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            autoFocus
            placeholder="What's wrong with this comment?"
            className="border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary w-full max-w-sm resize-y rounded-lg border p-2 text-xs outline-none"
          />
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReporting(false)}
              className="text-on-surface-variant hover:text-on-surface text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={pending || reason.trim().length === 0}
              className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-60"
            >
              Submit report
            </button>
          </span>
        </span>
      )}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </>
  );
}
