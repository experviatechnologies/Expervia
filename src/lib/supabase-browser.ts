import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components (the admin login form, sign-out
 * button). Uses the publishable (anon) key. Sign-in via this client writes the
 * session into cookies, which the server client and proxy then read.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
