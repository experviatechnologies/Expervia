import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
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
import { type ComposerTarget } from "./post-composer";
import { ComposerLauncher } from "./composer-launcher";
import { ReactionBar } from "./reaction-bar";
import { PostActions } from "./post-actions";
import { PollView } from "./poll-view";

export const metadata: Metadata = {
  title: "Feed",
  robots: { index: false, follow: false },
};

type TargetRef = { pods: { name: string; slug: string } | null };
type PostRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  post_targets: TargetRef[] | null;
  comments: { count: number }[] | null;
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();
  const { tag } = await searchParams;

  // Optional tag filter: narrow to posts carrying this skill.
  let taggedPostIds: string[] | null = null;
  let tagName: string | null = null;
  if (tag) {
    const [{ data: tagPosts }, { data: skill }] = await Promise.all([
      supabase.from("post_tags").select("post_id").eq("skill_id", tag),
      supabase.from("skills").select("name").eq("id", tag).maybeSingle(),
    ]);
    taggedPostIds = (tagPosts ?? []).map((r) => r.post_id);
    tagName = skill?.name ?? null;
    // No matches → a sentinel id so the posts query returns nothing.
    if (taggedPostIds.length === 0)
      taggedPostIds = ["00000000-0000-0000-0000-000000000000"];
  }

  let postsQuery = supabase
    .from("posts")
    .select(
      "id, body, created_at, author_id, post_targets(pods(name, slug)), comments(count)",
    )
    .eq("is_removed", false);
  if (taggedPostIds) postsQuery = postsQuery.in("id", taggedPostIds);
  postsQuery = postsQuery.order("created_at", { ascending: false }).limit(50);

  const [
    { data: mainPod },
    { data: myMemberships },
    { data: skillRows },
    { data: postRows },
  ] = await Promise.all([
    supabase.from("pods").select("id, name").eq("is_main", true).maybeSingle(),
    supabase
      .from("pod_memberships")
      .select("pods(id, name)")
      .eq("member_id", member.id),
    supabase
      .from("skills")
      .select("id, name")
      .eq("is_active", true)
      .order("sort", { ascending: true, nullsFirst: false })
      .order("name"),
    postsQuery,
  ]);

  const tagOptions = (skillRows ?? []).map((s) => ({ id: s.id, name: s.name }));

  // Where a member can post: the Main Community feed, plus any pods they're in.
  const targets: ComposerTarget[] = [];
  const seen = new Set<string>();
  if (mainPod) {
    targets.push({ id: mainPod.id, name: mainPod.name });
    seen.add(mainPod.id);
  }
  for (const row of myMemberships ?? []) {
    const pod = (
      row as unknown as { pods: { id: string; name: string } | null }
    ).pods;
    if (pod && !seen.has(pod.id)) {
      targets.push({ id: pod.id, name: pod.name });
      seen.add(pod.id);
    }
  }

  const posts = (postRows ?? []) as unknown as PostRow[];

  // Author display names — posts.author_id has no direct FK to profiles, so fetch
  // the profiles separately (RLS shows only visible members).
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const { data: authorRows } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name, headline")
        .in("member_id", authorIds)
    : { data: [] };
  const authorById = new Map((authorRows ?? []).map((a) => [a.member_id, a]));

  // Reaction tallies + the viewer's own reaction, per post.
  const postIds = posts.map((p) => p.id);
  const { data: reactionRows } = postIds.length
    ? await supabase
        .from("reactions")
        .select("target_id, reaction_type, member_id")
        .eq("target_type", "post")
        .in("target_id", postIds)
    : { data: [] };

  const reactionsByPost = new Map<
    string,
    { counts: ReactionCounts; mine: ReactionType | null }
  >();
  for (const id of postIds) {
    reactionsByPost.set(id, { counts: emptyReactionCounts(), mine: null });
  }
  for (const r of reactionRows ?? []) {
    const entry = reactionsByPost.get(r.target_id);
    if (!entry) continue;
    entry.counts[r.reaction_type as ReactionType] += 1;
    if (r.member_id === member.id) entry.mine = r.reaction_type as ReactionType;
  }

  const imagesByPost = await imageAttachmentsByPost(supabase, postIds);
  const tagsMap = await tagsByPost(supabase, postIds);
  const pollsMap = await pollsByPost(supabase, postIds, member.id);
  const isOps = member.role === "operations";

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
          ETEN
        </p>
        <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
          Feed
        </h1>
      </header>

      {tag && (
        <div className="border-outline-variant mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm">
          <span className="text-on-surface-variant">
            Filtered by{" "}
            <span className="text-primary font-medium">
              #{tagName ?? "tag"}
            </span>
          </span>
          <Link
            href="/feed"
            className="text-on-surface-variant hover:text-on-surface"
          >
            Clear
          </Link>
        </div>
      )}

      {targets.length > 0 && !tag && (
        <ComposerLauncher targets={targets} tagOptions={tagOptions} />
      )}

      {posts.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <MessageSquare className="text-on-surface-variant/40 size-9" />
          <p className="text-sm">
            Nothing here yet. Be the first to post — share what you&apos;re
            working on.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => {
            const author = authorById.get(post.author_id);
            const name = author?.full_name ?? "A member";
            const pods = (post.post_targets ?? [])
              .map((t) => t.pods)
              .filter((p): p is { name: string; slug: string } => Boolean(p));

            return (
              <li key={post.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/members/${post.author_id}`}
                    className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
                  >
                    {name.trim().charAt(0).toUpperCase()}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/members/${post.author_id}`}
                      className="text-on-surface font-medium hover:underline"
                    >
                      {name}
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

                <p className="text-on-surface mt-3 text-sm break-words whitespace-pre-line">
                  {post.body}
                </p>

                {(imagesByPost.get(post.id) ?? []).map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.url}
                    src={img.url}
                    alt={img.filename ?? "Post image"}
                    className="border-outline-variant mt-3 max-h-[28rem] w-full rounded-xl border object-cover"
                  />
                ))}

                {pollsMap.get(post.id) && (
                  <PollView postId={post.id} poll={pollsMap.get(post.id)!} />
                )}

                {(tagsMap.get(post.id) ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(tagsMap.get(post.id) ?? []).map((t) => (
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

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <ReactionBar
                    targetType="post"
                    targetId={post.id}
                    postId={post.id}
                    counts={
                      reactionsByPost.get(post.id)?.counts ??
                      emptyReactionCounts()
                    }
                    mine={reactionsByPost.get(post.id)?.mine ?? null}
                  />
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/feed/${post.id}`}
                      className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1.5 text-xs font-medium"
                    >
                      <MessageSquare className="size-3.5" />
                      {post.comments?.[0]?.count ?? 0}{" "}
                      {(post.comments?.[0]?.count ?? 0) === 1
                        ? "comment"
                        : "comments"}
                    </Link>
                    <PostActions
                      postId={post.id}
                      canRemove={isOps || post.author_id === member.id}
                      isAuthor={post.author_id === member.id}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
