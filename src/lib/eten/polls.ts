import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PollOption = { id: string; label: string; votes: number };
export type PollData = {
  options: PollOption[];
  totalVotes: number;
  myOptionId: string | null;
};

/**
 * Poll data (options, tallies, and the viewer's own vote) for a set of posts.
 * Only posts that actually have options appear in the map. Read through the
 * caller's session — poll_options / poll_votes SELECT ride can_see_post().
 */
export async function pollsByPost(
  supabase: SupabaseClient,
  postIds: string[],
  memberId: string,
): Promise<Map<string, PollData>> {
  const byPost = new Map<string, PollData>();
  if (postIds.length === 0) return byPost;

  const { data: optionRows } = await supabase
    .from("poll_options")
    .select("id, post_id, label, sort")
    .in("post_id", postIds)
    .order("sort", { ascending: true, nullsFirst: false });

  const options = optionRows ?? [];
  if (options.length === 0) return byPost;

  // Seed each poll's option list (votes start at 0).
  const optionById = new Map<string, PollOption>();
  for (const o of options) {
    const entry = byPost.get(o.post_id) ?? {
      options: [],
      totalVotes: 0,
      myOptionId: null,
    };
    const opt: PollOption = { id: o.id, label: o.label, votes: 0 };
    entry.options.push(opt);
    optionById.set(o.id, opt);
    byPost.set(o.post_id, entry);
  }

  const { data: voteRows } = await supabase
    .from("poll_votes")
    .select("post_id, option_id, member_id")
    .in("post_id", postIds);

  for (const v of voteRows ?? []) {
    const poll = byPost.get(v.post_id);
    const opt = optionById.get(v.option_id);
    if (!poll || !opt) continue;
    opt.votes += 1;
    poll.totalVotes += 1;
    if (v.member_id === memberId) poll.myOptionId = v.option_id;
  }

  return byPost;
}
