import { NextResponse, type NextRequest } from "next/server";
import { getTrackerSession, hasRole } from "@/lib/tracker/server/session";
import { calendarAdapter, oauthSecrets } from "@/lib/tracker/server/calendar";

/**
 * Starts connecting a calendar: checks the member, then sends them to the
 * provider to sign in and consent. The state and PKCE verifier travel in a
 * short-lived, httpOnly cookie that only the callback can read.
 */

const OAUTH_COOKIE = "trk_cal_oauth";
const SETTINGS = "/tracker/settings?tab=calendar";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const back = (result: string) =>
    NextResponse.redirect(
      new URL(`${SETTINGS}&calendar=${result}`, request.url),
    );

  const session = await getTrackerSession();
  if (!session) {
    return NextResponse.redirect(
      new URL(`/signin?next=${encodeURIComponent(SETTINGS)}`, request.url),
    );
  }
  if (!hasRole(session, "member")) return back("not_member");

  const provider = calendarAdapter(providerId);
  if (!provider) return back("unknown");
  if (!provider.configured()) return back("not_configured");

  const { state, verifier, challenge } = oauthSecrets();
  const redirectUri = new URL(
    `/api/tracker/calendar/${provider.id}/callback`,
    request.url,
  ).toString();

  const res = NextResponse.redirect(
    provider.authorizeUrl({ redirectUri, state, codeChallenge: challenge }),
  );
  res.cookies.set(
    OAUTH_COOKIE,
    JSON.stringify({
      state,
      verifier,
      memberId: session.member.id,
      provider: provider.id,
    }),
    {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/tracker/calendar",
      maxAge: 600,
    },
  );
  return res;
}
