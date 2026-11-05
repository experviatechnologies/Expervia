import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { stripTrackerPrefix } from "@/lib/tracker/host";

// Clean tracker paths that only exist on the tracker's own address (Phase 9).
// They are in the matcher for that host; anywhere else they pass straight
// through (the marketing homepage at "/" must not pay for a session check).
const TRACKER_ONLY = [
  "/availability",
  "/directory",
  "/requests",
  "/nominations",
  "/meetings",
  "/reports",
  "/demo",
];
// Shared screens the tracker's address serves as they are (not rewritten).
const SHARED_ON_TRACKER = [
  "/signin",
  "/join",
  "/mfa",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/suspended",
  "/auth",
];
const under = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Proxy (formerly "middleware") — runs before the matched routes render.
 *
 * Jobs:
 *   1. Refresh the Supabase session cookies. Server Components can't write
 *      cookies during render, so token refresh MUST happen here or users get
 *      randomly logged out.
 *   2. Gate the two authenticated areas:
 *        /admin      — staff only (members.role = 'operations').
 *        /dashboard  — any signed-in member.
 *      and bounce already-signed-in members away from /signin and /join.
 *   0. The tracker's own address (NEXT_PUBLIC_TRACKER_HOST, Phase 9): /tracker
 *      links there move to the clean path, /tracker on the main site moves
 *      there, and its clean paths are checked as the tracker pages they are
 *      rewritten to (next.config.ts).
 *   3. Two-step sign-in: anyone with an authenticator app set up enters a
 *      code before reaching a protected page, and operations members must
 *      set one up before entering /admin. Sales and Management are sent to
 *      /mfa by the tracker itself (their roles are resolved there).
 *
 * Defence-in-depth: each protected page/route ALSO verifies the session (and
 * role, via @/lib/auth) itself, so a matcher change can never silently expose
 * data. The role read here is scoped to /admin requests only.
 */
export async function proxy(request: NextRequest) {
  const rawPath = request.nextUrl.pathname;
  const trackerHost = process.env.NEXT_PUBLIC_TRACKER_HOST;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const onTrackerHost = Boolean(trackerHost) && host === trackerHost;
  const isTrackerPrefixed =
    rawPath === "/tracker" || rawPath.startsWith("/tracker/");

  if (trackerHost && isTrackerPrefixed) {
    const parent = trackerHost.split(".").slice(1).join(".");
    if (onTrackerHost) {
      // presales.<site>/tracker/x -> presales.<site>/x
      const url = request.nextUrl.clone();
      url.pathname = stripTrackerPrefix(rawPath);
      return NextResponse.redirect(url);
    }
    if (host === parent || host === `www.${parent}`) {
      // <site>/tracker/x -> presales.<site>/x (previews and localhost keep
      // working at /tracker).
      return NextResponse.redirect(
        `https://${trackerHost}${stripTrackerPrefix(rawPath)}${request.nextUrl.search}`,
      );
    }
  }
  if (!onTrackerHost && (rawPath === "/" || under(rawPath, TRACKER_ONLY))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Shared-session cookie domain when set (matches the other clients).
      cookieOptions: cookieDomain ? { domain: cookieDomain } : undefined,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sign-in strength, read from the token getUser() has just validated. The
  // authenticator check uses getUser()'s fresh factors (not the cookie copy),
  // so an admin reset takes effect at once.
  const aal = user
    ? (await supabase.auth.mfa.getAuthenticatorAssuranceLevel()).data
    : null;
  const hasMfa = (user?.factors ?? []).some(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
  const needsCode = hasMfa && aal?.currentLevel !== "aal2";

  // On the tracker's address, "/requests/x" is the tracker page
  // "/tracker/requests/x": classify it as such below.
  const path =
    onTrackerHost && !under(rawPath, SHARED_ON_TRACKER)
      ? `/tracker${rawPath === "/" ? "" : rawPath}`
      : rawPath;
  const isMfaPage = path === "/mfa";
  const isAdminArea = path === "/admin" || path.startsWith("/admin/");
  const isAdminLogin = path === "/admin/login";
  const MEMBER_PREFIXES = [
    "/dashboard",
    "/onboarding",
    "/profile",
    "/members",
    "/feed",
    "/pods",
    "/messages",
    "/notifications",
    "/settings",
  ];
  const isMemberArea = MEMBER_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isMemberAuthPage =
    path === "/signin" || path === "/join" || path === "/forgot-password";
  // The real presales tracker (the /tracker/demo stakeholder demo stays public).
  const isTrackerArea =
    (path === "/tracker" || path.startsWith("/tracker/")) &&
    !path.startsWith("/tracker/demo") &&
    path !== "/tracker/login";

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    return NextResponse.redirect(url);
  };
  const toMfa = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/mfa";
    url.search = `?next=${encodeURIComponent(rawPath + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  };

  // --- /mfa — signed-in only; the page itself decides what to show -----------
  if (isMfaPage) {
    if (!user) return redirectTo("/signin");
    return response;
  }

  // --- Two-step sign-in pending: enter the code before anything protected ----
  if (
    needsCode &&
    ((isAdminArea && !isAdminLogin) ||
      isMemberArea ||
      isTrackerArea ||
      // Supabase asks for the code before a password change on these accounts.
      path === "/reset-password")
  ) {
    return toMfa();
  }

  // --- /admin — staff only ---------------------------------------------------
  if (isAdminArea) {
    if (!user) {
      return isAdminLogin ? response : redirectTo("/admin/login");
    }
    // Signed in — must be an operations member to enter the admin console.
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isOps = member?.role === "operations";

    if (!isOps) return redirectTo("/dashboard");
    if (isAdminLogin) return redirectTo("/admin/overview");
    // The admin console always needs two-step sign-in (set up on first visit).
    if (aal?.currentLevel !== "aal2") return toMfa();
    return response;
  }

  // --- /tracker — any signed-in member; roles are checked per page/action ----
  if (isTrackerArea && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(rawPath)}`;
    return NextResponse.redirect(url);
  }

  // --- /dashboard — any signed-in member -------------------------------------
  if (isMemberArea && !user) {
    return redirectTo("/signin");
  }

  // --- /signin, /join — send signed-in members onward ------------------------
  if (isMemberAuthPage && user) {
    return redirectTo(safeNext(request.nextUrl.searchParams.get("next")));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/profile",
    "/profile/:path*",
    "/members",
    "/members/:path*",
    "/feed",
    "/feed/:path*",
    "/pods",
    "/pods/:path*",
    "/messages",
    "/messages/:path*",
    "/notifications",
    "/notifications/:path*",
    "/settings",
    "/settings/:path*",
    "/signin",
    "/join",
    "/forgot-password",
    "/reset-password",
    "/suspended",
    "/mfa",
    "/tracker",
    "/tracker/:path((?!demo|login).*)",
    // The tracker's own address serves these at the root (Phase 9). On any
    // other host the proxy returns at once for them.
    "/",
    "/availability/:path*",
    "/directory/:path*",
    "/requests/:path*",
    "/nominations/:path*",
    "/meetings/:path*",
    "/reports/:path*",
    "/demo/:path*",
  ],
};
