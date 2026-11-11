import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Where the installed ETEN app opens (the manifest's start_url). Sends each
 * person to their own home: staff to the admin console, Mentorship sign-ups
 * to the mentorship dashboard (which forwards mentors to theirs), everyone
 * else to the member dashboard. Signed-out visitors sign in first and come
 * back here, so they still land in the right place. App shortcuts pass
 * ?to=notifications or ?to=mentorship.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const to = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));
  // App shortcuts ask for a destination; anything else means "home".
  const want = request.nextUrl.searchParams.get("to");
  const target =
    want === "notifications" || want === "mentorship" ? want : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const back = target ? `/launch?to=${target}` : "/launch";
    return to(`/signin?next=${encodeURIComponent(back)}`);
  }

  const { data: member } = await supabase
    .from("members")
    .select("role, signup_source")
    .eq("id", user.id)
    .maybeSingle();
  const mentorshipOnly = member?.signup_source === "mentorship";

  if (target === "mentorship") return to("/mentorship/dashboard");
  if (target === "notifications") {
    return to(mentorshipOnly ? "/mentorship/notifications" : "/notifications");
  }
  if (member?.role === "operations") return to("/admin/overview");
  if (mentorshipOnly) return to("/mentorship/dashboard");
  return to("/dashboard");
}
