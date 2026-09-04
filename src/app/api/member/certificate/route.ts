import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, CERTIFICATES_BUCKET } from "@/lib/supabase";

/**
 * Streams a member's certificate file from the private `certificates` bucket.
 * Verifies the session, then confirms the requested path belongs to a
 * certification the caller is allowed to see (RLS: their own, or ops) — so a
 * crafted path can't sign someone else's object — then redirects to a
 * short-lived signed URL. Mirrors /api/admin/resume.
 */
export async function GET(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

  // RLS scopes this to the caller's own certifications (or all, for ops).
  const supabase = await createSupabaseServerClient();
  const { data: match } = await supabase
    .from("certifications")
    .select("id")
    .eq("certificate_path", path)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(CERTIFICATES_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
