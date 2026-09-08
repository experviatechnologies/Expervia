import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PostTag = { id: string; name: string; slug: string };

/**
 * Tags (skills) for a set of posts, keyed by post id. Read through the caller's
 * session — post_tags SELECT = can_see_post — so only tags on visible posts
 * come back.
 */
export async function tagsByPost(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<Map<string, PostTag[]>> {
  const byPost = new Map<string, PostTag[]>();
  if (postIds.length === 0) return byPost;

  const { data } = await supabase
    .from("post_tags")
    .select("post_id, skills(id, name, slug)")
    .in("post_id", postIds);

  for (const row of data ?? []) {
    const r = row as unknown as { post_id: string; skills: PostTag | null };
    if (!r.skills) continue;
    const list = byPost.get(r.post_id) ?? [];
    list.push(r.skills);
    byPost.set(r.post_id, list);
  }
  return byPost;
}
