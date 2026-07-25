import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (formerly "middleware") — runs before the /admin routes render.
 *
 * Two jobs, both scoped to /admin only (see `config.matcher`):
 *   1. Refresh the Supabase session cookies. Server Components can't write
 *      cookies during render, so token refresh MUST happen here or managers
 *      get randomly logged out.
 *   2. Redirect unauthenticated visitors to the login page (and bounce already
 *      signed-in managers away from the login page).
 *
 * This is defence-in-depth: each protected page/route ALSO verifies the
 * session itself (per the Next.js data-security guidance), so a matcher change
 * can never silently expose data.
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

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin/applications";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
