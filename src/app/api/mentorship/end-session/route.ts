import { NextResponse, type NextRequest } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Mentor-ended session (Monetization M-4). With no per-minute cron, paid 1:1
 * sessions are not force-closed at their scheduled end; instead the mentor ends
 * the meeting when the paid time is done. This force-closes the LiveKit room for
 * everyone. Gated to the Circle's mentor (or operations).
 */
export async function POST(request: NextRequest) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) {
    return NextResponse.json(
      { error: "Live meetings are not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    sessionId?: string;
  } | null;
  const sessionId = body?.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: session } = await admin
    .from("circle_sessions")
    .select("id, circle_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("mentor_id")
    .eq("id", session.circle_id)
    .maybeSingle();
  const ops = await isOperations();
  if (!circle || (circle.mentor_id !== me.id && !ops)) {
    return NextResponse.json(
      { error: "Only the mentor can end this session." },
      { status: 403 },
    );
  }

  const httpUrl = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  const svc = new RoomServiceClient(httpUrl, key, secret);
  const room = `eten-${session.circle_id}-${session.id}`;
  try {
    await svc.deleteRoom(room);
  } catch {
    // Room may not exist (no one joined, or already closed) - treat as ended.
  }

  return NextResponse.json({ ok: true });
}
