import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, RESUMES_BUCKET } from "@/lib/supabase";

/**
 * Streams the caller's OWN résumé from the private `resumes` bucket.
 *
 * The path is never taken from the request — we read it from the caller's own
 * profile row (RLS-scoped), so there is no way to sign someone else's object.
 * Redirects to a short-lived signed URL. Mirrors /api/member/certificate.
 *
 * A profile only has a résumé if it was attached by the M0.2 existing-member
 * migration (from the applicant's original upload).
 */
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS scopes this to the caller's own profile.
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_path")
    .eq("member_id", member.id)
    .maybeSingle();

  const path = profile?.resume_path;
  if (!path) {
    return NextResponse.json({ error: "No résumé on file." }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(RESUMES_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
