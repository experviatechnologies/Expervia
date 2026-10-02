import { NextResponse, type NextRequest } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Server-authoritative hard cut for live sessions (Availability AV-6). Runs on a
 * Vercel Cron every minute: any session whose scheduled end has just passed has
 * its LiveKit room force-closed, disconnecting everyone regardless of their
 * client clock. We only act on sessions that ended within the last 15 minutes so
 * we don't keep hammering long-finished rooms (LiveKit's own empty_timeout
 * closes anything we miss). Protected by CRON_SECRET when set.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    cronSecret &&
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) {
    return NextResponse.json(
      { error: "Live meetings are not configured." },
      { status: 500 },
    );
  }

  const admin = getSupabaseAdmin();
  const now = Date.now();

  // Scheduled sessions whose start is recent enough that their end could be in
  // our close window (started within the last ~6 hours covers any duration).
  const { data: rows } = await admin
    .from("circle_sessions")
    .select("id, circle_id, starts_at, duration_minutes")
    .not("starts_at", "is", null)
    .gte("starts_at", new Date(now - 6 * 60 * 60_000).toISOString())
    .lte("starts_at", new Date(now).toISOString());

  // RoomServiceClient wants an https host, not the wss client URL.
  const httpUrl = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  const svc = new RoomServiceClient(httpUrl, key, secret);

  let closed = 0;
  for (const r of rows ?? []) {
    const endMs =
      Date.parse(String(r.starts_at)) + (r.duration_minutes ?? 40) * 60_000;
    if (now >= endMs && now - endMs <= 15 * 60_000) {
      const room = `eten-${r.circle_id}-${r.id}`;
      try {
        await svc.deleteRoom(room);
        closed++;
      } catch {
        // Room may not exist (no one joined, or already closed) - ignore.
      }
    }
  }

  return NextResponse.json({ ok: true, closed });
}
