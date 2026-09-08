import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";
import {
  emptyReactionCounts,
  type ReactionCounts,
  type ReactionType,
} from "@/lib/eten/reactions";
import { imageAttachmentsByPost } from "@/lib/eten/post-attachments";
import { tagsByPost } from "@/lib/eten/post-tags";
import { pollsByPost } from "@/lib/eten/polls";
import { ReactionBar } from "../reaction-bar";
import { PostActions } from "../post-actions";
import { PollView } from "../poll-view";
import { CommentComposer } from "./comment-composer";
import { CommentsThread, type CommentNode } from "./comments-thread";

export const metadata: Metadata = {
  title: "Post",
  robots: { index: false, follow: false },
};

type TargetRef = { pods: { name: string; slug: string } | null };
type PostRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  post_targets: TargetRef[] | null;
};
type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  parent_comment_id: string | null;
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // RLS (can_see_post) decides visibility; an invisible/unknown post 404s.
  const { data: postData } = await supabase
    .from("posts")
    .select("id, body, created_at, author_id, post_targets(pods(name, slug))")
    .eq("id", postId)
    .eq("is_removed", false)
    .maybeSingle();

  if (!postData) notFound();
  const post = postData as unknown as PostRow;

  const { data: commentData } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, parent_comment_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const comments = (commentData ?? []) as CommentRow[];

  // Author names for the post + every comment (posts/comments have no FK to
  // profiles; RLS shows only visible members).
  const authorIds = [
    ...new Set([post.author_id, ...comments.map((c) => c.author_id)]),
  ];
  const { data: authorRows } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", authorIds)
    : { data: [] };
  const nameById = new Map(
    (authorRows ?? []).map((a) => [a.member_id, a.full_name]),
  );
  const nameOf = (id: string) => nameById.get(id) ?? "A member";

  // Reaction tallies for every comment on this post (one query).
  const commentIds = comments.map((c) => c.id);
  const { data: commentReactionRows } = commentIds.length
    ? await supabase
        .from("reactions")
        .select("target_id, reaction_type, member_id")
        .eq("target_type", "comment")
        .in("target_id", commentIds)
    : { data: [] };
  const commentReactions = new Map<
    string,
    { counts: ReactionCounts; mine: ReactionType | null }
  >();
  for (const id of commentIds) {
    commentReactions.set(id, { counts: emptyReactionCounts(), mine: null });
  }
  for (const r of commentReactionRows ?? []) {
    const entry = commentReactions.get(r.target_id);
    if (!entry) continue;
    entry.counts[r.reaction_type as ReactionType] += 1;
    if (r.member_id === member.id) entry.mine = r.reaction_type as ReactionType;
  }

  // Build the one-level comment tree (top-level, each with its replies).
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of comments) {
    const rx = commentReactions.get(c.id);
    byId.set(c.id, {
      id: c.id,
      authorId: c.author_id,
      authorName: nameOf(c.author_id),
      body: c.body,
      createdAt: c.created_at,
      replies: [],
      reactionCounts: rx?.counts ?? emptyReactionCounts(),
      myReaction: rx?.mine ?? null,
    });
  }
  for (const c of comments) {
    const node = byId.get(c.id)!;
    const parent = c.parent_comment_id
      ? byId.get(c.parent_comment_id)
      : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }

  const authorName = nameOf(post.author_id);
  const pods = (post.post_targets ?? [])
    .map((t) => t.pods)
    .filter((p): p is { name: string; slug: string } => Boolean(p));

  // Reaction tallies + the viewer's own reaction for this post.
  const { data: reactionRows } = await supabase
    .from("reactions")
    .select("reaction_type, member_id")
    .eq("target_type", "post")
    .eq("target_id", post.id);

  const counts: ReactionCounts = emptyReactionCounts();
  let myReaction: ReactionType | null = null;
  for (const r of reactionRows ?? []) {
    counts[r.reaction_type as ReactionType] += 1;
    if (r.member_id === member.id) myReaction = r.reaction_type as ReactionType;
  }

  const images = (await imageAttachmentsByPost(supabase, [post.id])).get(
    post.id,
  );
  const tags = (await tagsByPost(supabase, [post.id])).get(post.id) ?? [];
  const poll = (await pollsByPost(supabase, [post.id], member.id)).get(post.id);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <Link
        href="/feed"
        className="text-on-surface-variant hover:text-on-surface mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to feed
      </Link>

      {/* Post */}
      <article className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/members/${post.author_id}`}
            className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
          >
            {authorName.trim().charAt(0).toUpperCase()}
          </Link>
          <div className="min-w-0">
            <Link
              href={`/members/${post.author_id}`}
              className="text-on-surface font-medium hover:underline"
            >
              {authorName}
            </Link>
            <div className="text-on-surface-variant flex flex-wrap items-center gap-x-2 text-xs">
              <span>{timeAgo(post.created_at)}</span>
              {pods.length > 0 && <span aria-hidden>·</span>}
              {pods.map((pod) => (
                <Link
                  key={pod.slug}
                  href={`/pods/${pod.slug}`}
                  className="hover:text-on-surface"
                >
                  {pod.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="text-on-surface mt-4 text-sm break-words whitespace-pre-line">
          {post.body}
        </p>

        {(images ?? []).map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.url}
            src={img.url}
            alt={img.filename ?? "Post image"}
            className="border-outline-variant mt-4 max-h-[32rem] w-full rounded-xl border object-contain"
          />
        ))}

        {poll && <PollView postId={post.id} poll={poll} />}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/feed?tag=${t.id}`}
                className="border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40 rounded-full border px-2.5 py-0.5 text-xs transition-colors"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <ReactionBar
            targetType="post"
            targetId={post.id}
            postId={post.id}
            counts={counts}
            mine={myReaction}
          />
          <PostActions
            postId={post.id}
            canRemove={
              member.role === "operations" || post.author_id === member.id
            }
            isAuthor={post.author_id === member.id}
          />
        </div>
      </article>

      {/* New comment */}
      <div className="glass-card mt-6 rounded-2xl p-5">
        <CommentComposer postId={post.id} />
      </div>

      {/* Comments */}
      <section className="mt-8">
        <h2 className="font-display text-body-lg text-on-surface mb-4 font-bold">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>
        <CommentsThread
          postId={post.id}
          comments={roots}
          viewerId={member.id}
          isOps={member.role === "operations"}
        />
      </section>
    </div>
  );
}
