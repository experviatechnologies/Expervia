import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
 *
 * Defence-in-depth: each protected page/route ALSO verifies the session (and
 * role, via @/lib/auth) itself, so a matcher change can never silently expose
 * data. The role read here is scoped to /admin requests only.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const path = request.nextUrl.pathname;
  const isAdminArea = path === "/admin" || path.startsWith("/admin/");
  const isAdminLogin = path === "/admin/login";
  const MEMBER_PREFIXES = [
    "/dashboard",
    "/onboarding",
    "/profile",
    "/feed",
    "/pods",
    "/messages",
    "/notifications",
  ];
  const isMemberArea = MEMBER_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const isMemberAuthPage =
    path === "/signin" || path === "/join" || path === "/forgot-password";

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    return NextResponse.redirect(url);
  };

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
    if (isAdminLogin) return redirectTo("/admin/applications");
    return response;
  }

  // --- /dashboard — any signed-in member -------------------------------------
  if (isMemberArea && !user) {
    return redirectTo("/signin");
  }

  // --- /signin, /join — send signed-in members onward ------------------------
  if (isMemberAuthPage && user) {
    return redirectTo("/dashboard");
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
    "/feed",
    "/feed/:path*",
    "/pods",
    "/pods/:path*",
    "/messages",
    "/messages/:path*",
    "/notifications",
    "/notifications/:path*",
    "/signin",
    "/join",
    "/forgot-password",
    "/reset-password",
    "/suspended",
  ],
};
