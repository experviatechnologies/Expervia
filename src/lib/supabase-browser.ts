import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components (the admin login form, sign-out
 * button). Uses the publishable (anon) key. Sign-in via this client writes the
 * session into cookies, which the server client and proxy then read.
 */
export function createSupabaseBrowserClient() {
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Set NEXT_PUBLIC_COOKIE_DOMAIN (e.g. ".expervia.com") to share the session
    // across the apex site and the mentorship subdomain. Unset = host-only
    // cookies (current behaviour), so this is a safe no-op until configured.
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined,
  );
}
