"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, POST_MEDIA_BUCKET } from "@/lib/supabase";
import type { ReactionType } from "@/lib/eten/reactions";

type ActionResult = { ok: true } | { error: string };

const REACTION_TYPES: ReactionType[] = [
  "like",
  "insightful",
  "celebrate",
  "support",
];

const MAX_BODY = 5000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/**
 * Publish a post to one destination (the Main Community feed or a specific pod),
 * optionally with one image attachment.
 *
 * A post is a `posts` row plus a `post_targets` row per destination. Both writes
 * go through the member's OWN session client so RLS enforces authorship:
 * posts_insert_self requires author_id = auth.uid() + is_active_member, and
 * post_targets_insert requires the caller to own the post (owns_post helper).
 * The image file goes to a private bucket via service_role (no member storage
 * policies), and the attachment row via the session client. Any failure after
 * the post exists rolls the whole post back, so a post is all-or-nothing.
 */
export async function createPost(formData: FormData): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }

  const body = ((formData.get("body") as string) ?? "").trim();
  const targetPodId = (formData.get("targetPodId") as string) ?? "";
  if (!body) return { error: "Write something before posting." };
  if (body.length > MAX_BODY) {
    return { error: `Posts are limited to ${MAX_BODY} characters.` };
  }
  if (!targetPodId) return { error: "Choose where to post." };

  const entry = formData.get("image");
  const image = entry instanceof File && entry.size > 0 ? entry : null;
  if (image) {
    if (image.size > MAX_IMAGE_BYTES) {
      return {
        error: "That image is over 10 MB. Please choose a smaller one.",
      };
    }
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return { error: "Attach an image (PNG, JPG, WebP, or GIF)." };
    }
  }

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
    return { error: "Couldn't publish your post. Please try again." };
  }

  const { error: targetError } = await supabase
    .from("post_targets")
    .insert({ post_id: postId, pod_id: targetPodId });

  if (targetError) {
    console.error("createPost: target insert failed", targetError);
    // Roll back the orphaned post so it can't linger invisibly.
    await supabase.from("posts").delete().eq("id", postId);
    return { error: "Couldn't publish your post. Please try again." };
  }

  if (image) {
    const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `${postId}/${crypto.randomUUID()}-${safeName}`;
    // Buffer (not the File) — a streaming body fails opaquely under Node/undici.
    const bytes = Buffer.from(await image.arrayBuffer());
    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from(POST_MEDIA_BUCKET)
      .upload(objectPath, bytes, {
        contentType: image.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("createPost: image upload failed", uploadError);
      await supabase.from("posts").delete().eq("id", postId);
      return { error: "Couldn't upload your image. Please try again." };
    }

    const { error: attachError } = await supabase
      .from("post_attachments")
      .insert({
        post_id: postId,
        kind: "image",
        storage_path: objectPath,
        filename: image.name.slice(0, 200),
        mime: image.type || null,
      });

    if (attachError) {
      console.error("createPost: attachment insert failed", attachError);
      await getSupabaseAdmin()
        .storage.from(POST_MEDIA_BUCKET)
        .remove([objectPath]);
      await supabase.from("posts").delete().eq("id", postId);
      return { error: "Couldn't attach your image. Please try again." };
    }
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

const MAX_REASON = 1000;

/**
 * File a report on a post or comment. Any active member may report; the report
 * lands in the ops queue (/admin/reports). RLS reports_insert_self requires
 * reporter_id = auth.uid() and is_active_member.
 */
export async function reportContent(input: {
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }

  const reason = input.reason.trim();
  if (!reason) return { error: "Please add a reason." };
  if (reason.length > MAX_REASON) {
    return { error: `Keep the reason under ${MAX_REASON} characters.` };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: member.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason,
  });

  if (error) {
    return { error: "Couldn't file your report. Please try again." };
  }
  return { ok: true };
}

/**
 * Soft-remove (or restore) a post. RLS posts_update allows the author, ops, or a
 * lead of a target pod. Removed posts drop out of everyone's view via
 * can_see_post() except the author / ops / pod lead.
 */
export async function setPostRemoved(input: {
  postId: string;
  removed: boolean;
  reason?: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("posts")
    .update({
      is_removed: input.removed,
      removed_by: input.removed ? member.id : null,
      removed_reason: input.removed ? (input.reason ?? null) : null,
    })
    .eq("id", input.postId);

  if (error) {
    return { error: "Couldn't update the post. Please try again." };
  }

  revalidatePath("/feed");
  revalidatePath(`/feed/${input.postId}`);
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}

/**
 * Soft-remove (or restore) a comment. RLS comments_update allows the author,
 * ops, or a lead of a target pod.
 */
export async function setCommentRemoved(input: {
  commentId: string;
  postId: string;
  removed: boolean;
  reason?: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("comments")
    .update({
      is_removed: input.removed,
      removed_by: input.removed ? member.id : null,
      removed_reason: input.removed ? (input.reason ?? null) : null,
    })
    .eq("id", input.commentId);

  if (error) {
    return { error: "Couldn't update the comment. Please try again." };
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
