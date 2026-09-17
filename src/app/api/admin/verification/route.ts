import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin, VERIFICATIONS_BUCKET } from "@/lib/supabase";

/**
 * Streams a member's KYC document from the private `verifications` bucket to an
 * operations reviewer. Verifies session + ops role itself, confirms the path
 * belongs to a real verification row, then redirects to a short-lived signed
 * URL. Mirrors /api/admin/certificate.
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
  const { data: match } = await admin
    .from("member_verifications")
    .select("id")
    .eq("file_path", path)
    .maybeSingle();
  if (!match) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from(VERIFICATIONS_BUCKET)
    .createSignedUrl(path, 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }
  return NextResponse.redirect(data.signedUrl);
}
