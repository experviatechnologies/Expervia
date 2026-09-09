import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MessageSquare, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import {
  emptyReactionCounts,
  type ReactionCounts,
  type ReactionType,
} from "@/lib/eten/reactions";
import { imageAttachmentsByPost } from "@/lib/eten/post-attachments";
import { tagsByPost } from "@/lib/eten/post-tags";
import { pollsByPost } from "@/lib/eten/polls";
import { computeCompleteness } from "@/lib/eten/profile-completeness";
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

  // Optional tag filter.
  let taggedPostIds: string[] | null = null;
  let tagName: string | null = null;
  if (tag) {
    const [{ data: tagPosts }, { data: skill }] = await Promise.all([
      supabase.from("post_tags").select("post_id").eq("skill_id", tag),
      supabase.from("skills").select("name").eq("id", tag).maybeSingle(),
    ]);
    taggedPostIds = (tagPosts ?? []).map((r) => r.post_id);
    tagName = skill?.name ?? null;
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
    { data: allPodRows },
    { data: allMembershipRows },
    { data: profile },
    { count: skillCount },
    { count: certCount },
    { data: myCerts },
  ] = await Promise.all([
    supabase.from("pods").select("id, name").eq("is_main", true).maybeSingle(),
    supabase
      .from("pod_memberships")
      .select("pod_id, pods(id, name)")
      .eq("member_id", member.id),
    supabase
      .from("skills")
      .select("id, name")
      .eq("is_active", true)
      .order("sort", { ascending: true, nullsFirst: false })
      .order("name"),
    postsQuery,
    supabase.from("pods").select("id, name, slug").eq("is_main", false),
    supabase.from("pod_memberships").select("pod_id"),
    supabase
      .from("profiles")
      .select(
        "headline, job_title, location, bio, industry_experience, availability_status, years_experience, primary_specialization_pod_id",
      )
      .eq("member_id", member.id)
      .maybeSingle(),
    supabase
      .from("member_skills")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id),
    supabase
      .from("certifications")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id),
    supabase
      .from("certifications")
      .select("id, name, issuer, date_obtained")
      .eq("member_id", member.id)
      .eq("verification_status", "verified")
      .order("date_obtained", { ascending: false, nullsFirst: false })
      .limit(3),
  ]);

  const tagOptions = (skillRows ?? []).map((s) => ({ id: s.id, name: s.name }));

  const targets: ComposerTarget[] = [];
  const seen = new Set<string>();
  if (mainPod) {
    targets.push({ id: mainPod.id, name: mainPod.name });
    seen.add(mainPod.id);
  }
  const myPodIds = new Set<string>();
  for (const row of myMemberships ?? []) {
    const pod = (
      row as unknown as { pods: { id: string; name: string } | null }
    ).pods;
    if (pod) {
      myPodIds.add(pod.id);
      if (!seen.has(pod.id)) {
        targets.push({ id: pod.id, name: pod.name });
        seen.add(pod.id);
      }
    }
  }

  const posts = (postRows ?? []) as unknown as PostRow[];

  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const [{ data: authorRows }, { data: verifiedRows }] = await Promise.all([
    authorIds.length
      ? supabase
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", authorIds)
      : Promise.resolve({
          data: [] as { member_id: string; full_name: string }[],
        }),
    // Which authors hold ≥1 verified credential (own-or-ops RLS → service_role).
    authorIds.length
      ? getSupabaseAdmin()
          .from("certifications")
          .select("member_id")
          .eq("verification_status", "verified")
          .in("member_id", authorIds)
      : Promise.resolve({ data: [] as { member_id: string }[] }),
  ]);
  const authorById = new Map((authorRows ?? []).map((a) => [a.member_id, a]));
  const verifiedAuthors = new Set((verifiedRows ?? []).map((r) => r.member_id));

  // Reactions.
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
  for (const id of postIds)
    reactionsByPost.set(id, { counts: emptyReactionCounts(), mine: null });
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

  // Right panel: completeness + suggested pods.
  const completeness = profile
    ? computeCompleteness({
        headline: profile.headline,
        jobTitle: profile.job_title,
        location: profile.location,
        bio: profile.bio,
        industryExperience: profile.industry_experience,
        availabilityStatus: profile.availability_status,
        yearsExperience: profile.years_experience,
        primaryPodId: profile.primary_specialization_pod_id,
        skillCount: skillCount ?? 0,
        certCount: certCount ?? 0,
      })
    : null;
  const podCounts = new Map<string, number>();
  for (const m of allMembershipRows ?? [])
    podCounts.set(m.pod_id, (podCounts.get(m.pod_id) ?? 0) + 1);
  const suggestedPods = (allPodRows ?? [])
    .filter((p) => !myPodIds.has(p.id))
    .slice(0, 3)
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      members: podCounts.get(p.id) ?? 0,
    }));

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-8 px-4 py-6 lg:px-8">
      <main className="min-w-0 flex-1">
        {/* Section header (desktop; mobile uses the app top bar) */}
        <div className="mb-5 hidden items-baseline gap-3 md:flex">
          <h1 className="text-eten-ink font-display text-xl font-semibold">
            Home
          </h1>
          <span className="bg-eten-line h-5 w-px" />
          <span className="text-eten-faint text-sm">
            The ETEN community feed
          </span>
        </div>

        {tag && (
          <div className="border-eten-line mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm">
            <span className="text-eten-ink-muted">
              Filtered by{" "}
              <span className="text-eten-accent font-medium">
                #{tagName ?? "tag"}
              </span>
            </span>
            <Link href="/feed" className="text-eten-faint hover:text-eten-ink">
              Clear
            </Link>
          </div>
        )}

        {targets.length > 0 && !tag && (
          <ComposerLauncher targets={targets} tagOptions={tagOptions} />
        )}

        {posts.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
            <MessageSquare className="text-eten-faint/50 size-9" />
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
              const rx = reactionsByPost.get(post.id);
              const commentCount = post.comments?.[0]?.count ?? 0;

              return (
                <li
                  key={post.id}
                  className="bg-eten-panel border-eten-line rounded-2xl border p-5"
                >
                  <div className="flex items-start gap-3">
                    <Link
                      href={`/members/${post.author_id}`}
                      className="from-eten-accent grid size-10 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br to-[#3257b8] font-bold text-white"
                    >
                      {name.trim().charAt(0).toUpperCase()}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          href={`/members/${post.author_id}`}
                          className="text-eten-ink font-semibold hover:underline"
                        >
                          {name}
                        </Link>
                        {verifiedAuthors.has(post.author_id) && (
                          <span className="text-eten-verified bg-eten-verified-soft inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold">
                            <BadgeCheck className="size-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-eten-faint flex flex-wrap items-center gap-x-2 text-xs">
                        <span>{timeAgo(post.created_at)}</span>
                        {pods.map((pod) => (
                          <Link
                            key={pod.slug}
                            href={`/pods/${pod.slug}`}
                            className="text-eten-accent font-mono hover:underline"
                          >
                            #{pod.name.toLowerCase().replace(/\s+/g, "-")}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-eten-ink mt-3 text-sm break-words whitespace-pre-line">
                    {post.body}
                  </p>

                  {(imagesByPost.get(post.id) ?? []).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.url}
                      src={img.url}
                      alt={img.filename ?? "Post image"}
                      className="border-eten-line mt-3 max-h-[28rem] w-full rounded-xl border object-cover"
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
                          className="border-eten-line text-eten-ink-muted hover:text-eten-accent hover:border-eten-accent/40 rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors"
                        >
                          #{t.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="border-eten-line-soft mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <ReactionBar
                      targetType="post"
                      targetId={post.id}
                      postId={post.id}
                      counts={rx?.counts ?? emptyReactionCounts()}
                      mine={rx?.mine ?? null}
                    />
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/feed/${post.id}`}
                        className="text-eten-faint hover:text-eten-ink inline-flex items-center gap-1.5 text-xs font-medium"
                      >
                        <MessageSquare className="size-3.5" />
                        {commentCount}{" "}
                        {commentCount === 1 ? "comment" : "comments"}
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
      </main>

      {/* Right context panel */}
      <aside className="hidden w-80 shrink-0 xl:block">
        <div className="sticky top-6 flex flex-col gap-4">
          {completeness && completeness.percent < 100 && (
            <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
              <h3 className="text-eten-ink font-display mb-3 text-sm font-semibold">
                Complete your profile
              </h3>
              <div className="flex items-center gap-3">
                <Ring percent={completeness.percent} />
                <div>
                  <p className="text-eten-ink text-sm font-semibold">
                    {completeness.done} of {completeness.total} done
                  </p>
                  <p className="text-eten-faint text-xs">
                    A few quick wins left
                  </p>
                </div>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {completeness.items
                  .filter((i) => !i.done)
                  .slice(0, 3)
                  .map((i) => (
                    <li key={i.label}>
                      <Link
                        href={i.href}
                        className="text-eten-ink-muted hover:text-eten-ink text-xs"
                      >
                        {i.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
            <h3 className="text-eten-ink font-display mb-3 text-sm font-semibold">
              Your verified credentials
            </h3>
            {(myCerts ?? []).length === 0 ? (
              <p className="text-eten-faint text-xs">
                No verified credentials yet.{" "}
                <Link
                  href="/profile/certifications"
                  className="text-eten-accent hover:underline"
                >
                  Add one
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-col">
                {(myCerts ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="border-eten-line-soft flex items-start gap-2.5 border-t py-2 first:border-t-0 first:pt-0"
                  >
                    <span className="bg-eten-verified-soft text-eten-verified grid size-7 shrink-0 place-items-center rounded-lg">
                      <BadgeCheck className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-eten-ink text-[13px] leading-snug font-semibold">
                        {c.name}
                      </p>
                      <p className="text-eten-faint text-xs">
                        {[c.issuer, c.date_obtained?.slice(0, 4)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {suggestedPods.length > 0 && (
            <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
              <h3 className="text-eten-ink font-display mb-3 text-sm font-semibold">
                Pods to explore
              </h3>
              <div className="flex flex-col">
                {suggestedPods.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/pods/${p.slug}`}
                    className="border-eten-line-soft hover:bg-eten-hover -mx-2 flex items-center gap-2.5 rounded-lg border-t px-2 py-2 first:border-t-0 first:pt-0"
                  >
                    <span className="bg-eten-accent-soft text-eten-accent grid size-7 shrink-0 place-items-center rounded-lg font-mono font-semibold">
                      #
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-eten-ink block text-[13px] font-semibold">
                        {p.name}
                      </span>
                      <span className="text-eten-faint flex items-center gap-1 text-xs">
                        <Users className="size-3" />
                        {p.members} {p.members === 1 ? "member" : "members"}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/** Small completeness ring. */
function Ring({ percent }: { percent: number }) {
  const r = 15.5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <svg viewBox="0 0 36 36" className="size-12 shrink-0" aria-hidden>
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--color-eten-line)"
        strokeWidth="4"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--color-eten-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="21.5"
        textAnchor="middle"
        fill="var(--color-eten-ink)"
        fontSize="9"
        fontWeight="700"
        fontFamily="var(--font-sans)"
      >
        {percent}%
      </text>
    </svg>
  );
}
