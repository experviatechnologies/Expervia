import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, POST_MEDIA_BUCKET } from "@/lib/supabase";

export type PostImage = { url: string; filename: string | null };

/**
 * Image attachments for a set of posts, as short-lived signed URLs keyed by
 * post id. The rows are read through the caller's session (post_attachments
 * SELECT = can_see_post), so only attachments on visible posts come back; the
 * URLs are signed with service_role since the bucket is private.
 */
export async function imageAttachmentsByPost(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<Map<string, PostImage[]>> {
  const byPost = new Map<string, PostImage[]>();
  if (postIds.length === 0) return byPost;

  const { data: rows } = await supabase
    .from("post_attachments")
    .select("post_id, storage_path, filename")
    .in("post_id", postIds)
    .eq("kind", "image");

  const atts = (rows ?? []).filter(
    (
      a,
    ): a is {
      post_id: string;
      storage_path: string;
      filename: string | null;
    } => Boolean(a.storage_path),
  );
  if (atts.length === 0) return byPost;

  // Sign every object path in one call (1-hour TTL so images don't expire while
  // the page is open).
  const { data: signed } = await getSupabaseAdmin()
    .storage.from(POST_MEDIA_BUCKET)
    .createSignedUrls(
      atts.map((a) => a.storage_path),
      3600,
    );

  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  for (const a of atts) {
    const url = urlByPath.get(a.storage_path);
    if (!url) continue;
    const list = byPost.get(a.post_id) ?? [];
    list.push({ url, filename: a.filename });
    byPost.set(a.post_id, list);
  }
  return byPost;
}
