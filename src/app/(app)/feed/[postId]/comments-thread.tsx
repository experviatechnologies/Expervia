"use client";

import { useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/time";
import { CommentComposer } from "./comment-composer";

export type CommentNode = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies: CommentNode[];
};

export function CommentsThread({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentNode[];
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
          <CommentItem postId={postId} comment={c} canReply />
          {c.replies.length > 0 && (
            <ul className="border-outline-variant/50 mt-4 flex flex-col gap-4 border-l pl-4">
              {c.replies.map((r) => (
                <li key={r.id}>
                  <CommentItem postId={postId} comment={r} canReply={false} />
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
}: {
  postId: string;
  comment: CommentNode;
  canReply: boolean;
}) {
  const [replying, setReplying] = useState(false);

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

        {canReply && !replying && (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="text-on-surface-variant hover:text-on-surface mt-1.5 text-xs font-medium"
          >
            Reply
          </button>
        )}

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
