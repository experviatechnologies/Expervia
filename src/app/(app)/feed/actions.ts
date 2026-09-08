"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { ReactionType } from "@/lib/eten/reactions";

type ActionResult = { ok: true } | { error: string };

const REACTION_TYPES: ReactionType[] = [
  "like",
  "insightful",
  "celebrate",
  "support",
];

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

  // Generate the id ourselves rather than reading it back with .select(): the
  // posts SELECT policy is can_see_post(), which returns false until the post
  // has a target in a visible pod — so a select-after-insert would find zero
  // rows here (the target doesn't exist yet) and look like a failure.
  const postId = crypto.randomUUID();

  const { error: postError } = await supabase
    .from("posts")
    .insert({ id: postId, author_id: member.id, body });

  if (postError) {
    console.error("createPost: post insert failed", postError);
    // TEMP DIAGNOSTIC: surface the real cause to the browser.
    return {
      error: `POST insert failed: ${postError.message} [code ${postError.code}]`,
    };
  }

  const { error: targetError } = await supabase
    .from("post_targets")
    .insert({ post_id: postId, pod_id: input.targetPodId });

  if (targetError) {
    console.error("createPost: target insert failed", targetError);
    // Roll back the orphaned post so it can't linger invisibly.
    await supabase.from("posts").delete().eq("id", postId);
    // TEMP DIAGNOSTIC: surface the real cause to the browser.
    return {
      error: `TARGET insert failed: ${targetError.message} [code ${targetError.code}] (podId=${input.targetPodId})`,
    };
  }

  revalidatePath("/feed");
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}

const MAX_COMMENT = 3000;

/**
 * Add a comment to a post, or a reply to a top-level comment (one level deep —
 * the `enforce_comment_depth` trigger rejects replying to a reply). Writes
 * through the member's session: comments_insert_self requires author_id =
 * auth.uid(), is_active_member, and that the post is visible to the caller.
 */
export async function addComment(input: {
  postId: string;
  body: string;
  parentCommentId?: string | null;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }

  const body = input.body.trim();
  if (!body) return { error: "Write a comment first." };
  if (body.length > MAX_COMMENT) {
    return { error: `Comments are limited to ${MAX_COMMENT} characters.` };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").insert({
    post_id: input.postId,
    author_id: member.id,
    body,
    parent_comment_id: input.parentCommentId ?? null,
  });

  if (error) {
    // The depth trigger raises a message containing "one level deep".
    if (error.message.includes("one level")) {
      return { error: "You can only reply to a top-level comment." };
    }
    return { error: "Couldn't post your comment. Please try again." };
  }

  revalidatePath(`/feed/${input.postId}`);
  revalidatePath("/feed");
  return { ok: true };
}

/**
 * Toggle the caller's reaction on a post or comment. One reaction per member per
 * item (enforced by a unique constraint), so:
 *   - no current reaction        → insert this type
 *   - same type already          → remove it (toggle off)
 *   - a different type            → change it to this type
 * All writes go through the member's session; reactions_*_self RLS scopes them
 * to the caller and checks the target is visible. `postId` is only for
 * revalidation (a comment reaction still refreshes the post it lives on).
 */
export async function toggleReaction(input: {
  targetType: "post" | "comment";
  targetId: string;
  reactionType: ReactionType;
  postId: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }
  if (!REACTION_TYPES.includes(input.reactionType)) {
    return { error: "Unknown reaction." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, reaction_type")
    .eq("member_id", member.id)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .maybeSingle();

  let error;
  if (!existing) {
    ({ error } = await supabase.from("reactions").insert({
      member_id: member.id,
      target_type: input.targetType,
      target_id: input.targetId,
      reaction_type: input.reactionType,
    }));
  } else if (existing.reaction_type === input.reactionType) {
    ({ error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id));
  } else {
    ({ error } = await supabase
      .from("reactions")
      .update({ reaction_type: input.reactionType })
      .eq("id", existing.id));
  }

  if (error) {
    return { error: "Couldn't save your reaction. Please try again." };
  }

  revalidatePath(`/feed/${input.postId}`);
  revalidatePath("/feed");
  return { ok: true };
}
