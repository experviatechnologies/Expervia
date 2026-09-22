import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin, EVENT_MEDIA_BUCKET } from "@/lib/supabase";
import { EventsManager, type EventRow } from "./events-manager";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

type DbEvent = {
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
  published: boolean;
};

/** ISO timestamp → "YYYY-MM-DDTHH:mm" in WAT, for a datetime-local input. */
function toWatInput(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = g("hour") === "24" ? "00" : g("hour");
  return `${g("year")}-${g("month")}-${g("day")}T${hour}:${g("minute")}`;
}

function timeStatus(
  startAt: string | null,
  endAt: string | null,
): EventRow["timeStatus"] {
  if (!startAt) return "undated";
  const now = Date.now();
  const start = new Date(startAt).getTime();
  // No end time → treat as a point-in-time event that "ends" ~2h after start.
  const end = endAt ? new Date(endAt).getTime() : start + 2 * 60 * 60 * 1000;
  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "ended";
}

export default async function AdminSiteEventsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("events")
    .select(
      "id, title, blurb, speaker, speaker_title, start_at, end_at, platform, join_url, recording_url, image_path, published",
    )
    .order("start_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as DbEvent[];

  const events: EventRow[] = rows.map((e) => ({
    id: e.id,
    title: e.title,
    blurb: e.blurb,
    speaker: e.speaker,
    speakerTitle: e.speaker_title,
    platform: e.platform,
    joinUrl: e.join_url,
    recordingUrl: e.recording_url,
    imagePath: e.image_path,
    imageUrl: e.image_path
      ? admin.storage.from(EVENT_MEDIA_BUCKET).getPublicUrl(e.image_path).data
          .publicUrl
      : null,
    startLocal: toWatInput(e.start_at),
    endLocal: toWatInput(e.end_at),
    published: e.published,
    timeStatus: timeStatus(e.start_at, e.end_at),
  }));

  const publishedCount = events.filter((e) => e.published).length;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Events
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Manage what shows on the public events page. {events.length} total ·{" "}
          {publishedCount} published. Times are West Africa Time (WAT).
        </p>
      </header>

      <EventsManager events={events} />
    </div>
  );
}
