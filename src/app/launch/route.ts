import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Where the installed ETEN app opens (the manifest's start_url). Sends each
 * person to their own home: staff to the admin console, Mentorship sign-ups
 * to the mentorship dashboard (which forwards mentors to theirs), everyone
 * else to the member dashboard. Signed-out visitors sign in first and come
 * back here, so they still land in the right place.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const to = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return to("/signin?next=/launch");

  const { data: member } = await supabase
    .from("members")
    .select("role, signup_source")
    .eq("id", user.id)
    .maybeSingle();

  if (member?.role === "operations") return to("/admin/overview");
  if (member?.signup_source === "mentorship")
    return to("/mentorship/dashboard");
  return to("/dashboard");
}
