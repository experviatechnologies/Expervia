import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";
import { PostComposer, type ComposerTarget } from "./post-composer";

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
};

export default async function FeedPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const [{ data: mainPod }, { data: myMemberships }, { data: postRows }] =
    await Promise.all([
      supabase
        .from("pods")
        .select("id, name")
        .eq("is_main", true)
        .maybeSingle(),
      supabase
        .from("pod_memberships")
        .select("pods(id, name)")
        .eq("member_id", member.id),
      supabase
        .from("posts")
        .select(
          "id, body, created_at, author_id, post_targets(pods(name, slug))",
        )
        .eq("is_removed", false)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

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

      {targets.length > 0 && <PostComposer targets={targets} />}

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

                <p className="text-on-surface mt-3 text-sm whitespace-pre-line">
                  {post.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
