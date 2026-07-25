import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import {
  getSupabaseAdmin,
  APPLICATIONS_TABLE,
  RESUMES_BUCKET,
} from "@/lib/supabase";

/**
 * Streams a résumé from the private `resumes` bucket to an authenticated
 * manager. Verifies the session itself (never relies on the proxy alone),
 * confirms the requested path belongs to a real application, then redirects to
 * a short-lived signed URL so the private object is never exposed publicly.
 */
export async function GET(request: NextRequest) {
  const manager = await getCurrentManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Only sign paths that actually belong to a stored application — prevents
  // signing arbitrary objects via a crafted path.
  const { data: match } = await admin
    .from(APPLICATIONS_TABLE)
    .select("id")
    .eq("resume_path", path)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
