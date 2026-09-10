import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Email confirmation + magic-link + password-recovery callback.
 *
 * Supabase can hand us the link in either of two shapes, depending on how the
 * email templates are written, so we handle both:
 *
 *   1. token_hash flow — `${origin}/auth/confirm?token_hash=…&type=…`, produced
 *      by templates that use `{{ .TokenHash }}`. We call verifyOtp; no PKCE code
 *      verifier is needed, so this works cross-device.
 *   2. PKCE code flow — `${origin}/auth/confirm?code=…`, produced by the default
 *      templates that use `{{ .ConfirmationURL }}`: Supabase verifies the token
 *      on its own server, then redirects here with a `code` to exchange. This
 *      needs the code-verifier cookie set when the flow began (same browser).
 *
 * Either way we end up with session cookies written via the server client, then
 * redirect the now signed-in member onward. Confirmation/first sign-in stamps
 * members.claimed_at (the on_auth_user_confirmed trigger), activating them.
 *
 * Only same-origin relative `next` paths are honoured, so this can't be used as
 * an open redirect. A leading "//" or "/\" is a protocol-relative URL (e.g.
 * "//evil.com" → https://evil.com/), so those are rejected too — a plain
 * `startsWith("/")` check is not sufficient.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\")
      ? nextParam
      : "/dashboard";

  const supabase = await createSupabaseServerClient();

  // 1. token_hash flow (templates using {{ .TokenHash }}).
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // 2. PKCE code flow (default templates using {{ .ConfirmationURL }}).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failure = new URL("/signin", request.url);
  failure.searchParams.set("error", "link_invalid");
  return NextResponse.redirect(failure);
}
