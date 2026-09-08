import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin, CERTIFICATES_BUCKET } from "@/lib/supabase";

/**
 * Streams a member's certificate file from the private `certificates` bucket to
 * an operations reviewer, so they can verify the credential. Verifies the
 * session + ops role itself (never relies on the proxy alone), confirms the
 * requested path belongs to a real certification, then redirects to a
 * short-lived signed URL. Mirrors /api/admin/resume; the member-facing
 * equivalent is /api/member/certificate.
 */
export async function GET(request: NextRequest) {
  const manager = await getCurrentManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOperations())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Only sign paths that actually belong to a stored certification — prevents
  // signing arbitrary objects via a crafted path.
  const { data: match } = await admin
    .from("certifications")
    .select("id")
    .eq("certificate_path", path)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
