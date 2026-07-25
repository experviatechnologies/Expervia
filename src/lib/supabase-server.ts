import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Uses the publishable (anon) key plus the signed-in manager's session, which
 * lives in cookies. This is the client used to verify WHO is making a request.
 * Privileged data reads still go through getSupabaseAdmin() (service_role) in
 * @/lib/supabase, only after the session has been verified here.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies can't be written
          // during render. The proxy (src/proxy.ts) refreshes the session
          // cookies on the way in, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Returns the signed-in manager (or null). Contacts Supabase Auth to validate
 * the session token, so it's authoritative — use it, not getSession(), to gate
 * access.
 */
export async function getCurrentManager() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
