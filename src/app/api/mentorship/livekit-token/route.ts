import { NextResponse, type NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Mints a short-lived LiveKit access token for a scheduled class's room, and
 * returns the server URL so the browser never needs a public env var. The room
 * name is derived from the circle + session ids. Access is limited to the
 * Circle's mentor, its enrolled members, and operations; the mentor/ops join as
 * room admin. Secrets stay server-side.
 */
export async function GET(request: NextRequest) {
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

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing class." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: session } = await admin
    .from("circle_sessions")
    .select("id, circle_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const { data: circle } = await admin
    .from("mentorship_circles")
    .select("mentor_id")
    .eq("id", session.circle_id)
    .maybeSingle();
  if (!circle) {
    return NextResponse.json({ error: "Circle not found." }, { status: 404 });
  }

  const isMentor = circle.mentor_id === me.id;
  const ops = await isOperations();
  let isMember = false;
  if (!isMentor && !ops) {
    const { data: m } = await admin
      .from("circle_memberships")
      .select("member_id")
      .eq("circle_id", session.circle_id)
      .eq("member_id", me.id)
      .maybeSingle();
    isMember = Boolean(m);
  }
  if (!isMentor && !isMember && !ops) {
    return NextResponse.json(
      { error: "You don't have access to this class." },
      { status: 403 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("member_id", me.id)
    .maybeSingle();

  const room = `eten-${session.circle_id}-${session.id}`;
  const at = new AccessToken(key, secret, {
    identity: me.id,
    name: profile?.full_name ?? "ETEN member",
    ttl: "2h",
  });
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    roomAdmin: isMentor || ops,
  });
  const token = await at.toJwt();

  return NextResponse.json({ token, url, room });
}
