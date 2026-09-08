import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Email confirmation + magic-link callback.
 *
 * Supabase emails a link back to `${origin}/auth/confirm?token_hash=…&type=…`
 * (see emailRedirectTo in the join/sign-in forms). We verify the one-time token,
 * which writes the session cookies via the server client, then redirect the now
 * signed-in member onward. Confirming the email also stamps members.claimed_at
 * (the on_auth_user_confirmed trigger), activating the account.
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
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\")
      ? nextParam
      : "/dashboard";

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failure = new URL("/signin", request.url);
  failure.searchParams.set("error", "link_invalid");
  return NextResponse.redirect(failure);
}
