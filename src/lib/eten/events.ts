import "server-only";
import { getSupabaseAdmin, EVENT_MEDIA_BUCKET } from "@/lib/supabase";

/**
 * A published event, as rendered on the public /events board. Sourced from the
 * `events` table (managed in /admin/site-events). Dates are ISO strings with
 * offset; `image`/`recordingUrl` are absent when not set.
 */
export type PublicEvent = {
  id: string;
  title: string;
  blurb: string | null;
  speaker: string | null;
  speakerTitle: string | null;
  start: string | null;
  end: string | null;
  platform: string | null;
  joinUrl: string | null;
  image: string | null;
  recordingUrl: string | null;
};

type DbRow = {
  id: string;
  title: string;
  blurb: string | null;
  speaker: string | null;
  speaker_title: string | null;
  start_at: string | null;
  end_at: string | null;
  platform: string | null;
  join_url: string | null;
  recording_url: string | null;
  image_path: string | null;
};

/**
 * Reads PUBLISHED events for the public board. Uses the service_role client and
 * an explicit `published` filter (rather than a cookie-bound session client) so
 * the /events page can stay statically generated with ISR — no per-request
 * cookies, no dynamic opt-in.
 */
export async function getPublishedEvents(): Promise<PublicEvent[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("events")
    .select(
      "id, title, blurb, speaker, speaker_title, start_at, end_at, platform, join_url, recording_url, image_path",
    )
    .eq("published", true);
  if (error || !data) return [];

  return (data as DbRow[]).map((e) => ({
    id: e.id,
    title: e.title,
    blurb: e.blurb,
    speaker: e.speaker,
    speakerTitle: e.speaker_title,
    start: e.start_at,
    end: e.end_at,
    platform: e.platform,
    joinUrl: e.join_url,
    image: e.image_path
      ? admin.storage.from(EVENT_MEDIA_BUCKET).getPublicUrl(e.image_path).data
          .publicUrl
      : null,
    recordingUrl: e.recording_url,
  }));
}
