import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getTrackerSession, hasRole } from "@/lib/tracker/server/session";
import {
  calendarAdapter,
  saveConnection,
  syncBusyFor,
} from "@/lib/tracker/server/calendar";
import { auditTracker } from "@/lib/tracker/server/events";

/**
 * The provider sends the member back here after they consent (or decline).
 * Checks the state against the cookie set by /start and that the same member
 * is still signed in, swaps the code for tokens, and stores them encrypted.
 */

const OAUTH_COOKIE = "trk_cal_oauth";
const SETTINGS = "/tracker/settings?tab=calendar";

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const back = (result: string) => {
    const res = NextResponse.redirect(
      new URL(`${SETTINGS}&calendar=${result}`, request.url),
    );
    res.cookies.set(OAUTH_COOKIE, "", {
      path: "/api/tracker/calendar",
      maxAge: 0,
    });
    return res;
  };

  const q = request.nextUrl.searchParams;
  let saved: {
    state?: string;
    verifier?: string;
    memberId?: string;
    provider?: string;
  } = {};
  try {
    saved = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value ?? "{}");
  } catch {
    saved = {};
  }

  const state = q.get("state") ?? "";
  if (!saved.state || !saved.verifier || !same(state, saved.state)) {
    return back("expired_link");
  }
  if (q.get("error")) {
    // access_denied: they chose not to give access.
    return back(q.get("error") === "access_denied" ? "denied" : "failed");
  }

  const provider = calendarAdapter(providerId);
  if (!provider || provider.id !== saved.provider || !provider.configured()) {
    return back("failed");
  }

  const session = await getTrackerSession();
  if (
    !session ||
    session.member.id !== saved.memberId ||
    !hasRole(session, "member")
  ) {
    return back("expired_link");
  }

  const code = q.get("code");
  if (!code) return back("failed");

  try {
    const tokens = await provider.exchangeCode({
      code,
      redirectUri: new URL(
        `/api/tracker/calendar/${provider.id}/callback`,
        request.url,
      ).toString(),
      codeVerifier: saved.verifier,
    });
    await saveConnection({
      memberId: session.member.id,
      provider: provider.id,
      tokens,
      accountEmail: tokens.accountEmail,
    });
  } catch (e) {
    console.error(
      "calendar connect failed",
      e instanceof Error ? e.message : e,
    );
    return back("failed");
  }

  // Read busy times now so checks work straight away (best-effort; the
  // scheduled sync retries every 15 minutes).
  await syncBusyFor(session.member.id).catch(() => false);

  await auditTracker({
    actorId: session.member.id,
    action: "calendar_connected",
    targetType: "member",
    targetId: session.member.id,
    metadata: { provider: provider.id },
  });
  return back("connected");
}
