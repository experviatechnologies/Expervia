"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ActionResult = { ok: true } | { error: string };

const MAX_BODY = 5000;

/**
 * Publish a post to one destination (the Main Community feed or a specific pod).
 *
 * A post is a `posts` row plus a `post_targets` row per destination. Both writes
 * go through the member's OWN session client so RLS enforces authorship:
 * posts_insert_self requires author_id = auth.uid() + is_active_member, and
 * post_targets_insert requires the caller to own the post. If the target insert
 * fails we delete the just-created post so we never leave an untargeted (and
 * therefore invisible) orphan.
 */
export async function createPost(input: {
  body: string;
  targetPodId: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }

  const body = input.body.trim();
  if (!body) return { error: "Write something before posting." };
  if (body.length > MAX_BODY) {
    return { error: `Posts are limited to ${MAX_BODY} characters.` };
  }
  if (!input.targetPodId) return { error: "Choose where to post." };

  const supabase = await createSupabaseServerClient();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ author_id: member.id, body })
    .select("id")
    .single();

  if (error || !post) {
    return { error: "Couldn't publish your post. Please try again." };
  }

  const { error: targetError } = await supabase
    .from("post_targets")
    .insert({ post_id: post.id, pod_id: input.targetPodId });

  if (targetError) {
    // Roll back the orphaned post so it can't linger invisibly.
    await supabase.from("posts").delete().eq("id", post.id);
    return { error: "Couldn't publish your post. Please try again." };
  }

  revalidatePath("/feed");
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}
