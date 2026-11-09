import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin, RESUMES_BUCKET } from "@/lib/supabase";
import { canSeePrivateDetails } from "@/lib/eten/member-access";
import { writeAudit } from "@/lib/eten/audit";

/**
 * A member's CV, for the member, ETEN staff and their Pod Leaders (the link in
 * the pod roster export). The file path is read from the member's profile,
 * never from the request. Redirects to a 60-second signed link; every view by
 * someone other than the member is recorded in the audit log.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.redirect(
      new URL(
        `/signin?next=${encodeURIComponent(`/api/members/${id}/cv`)}`,
        _request.url,
      ),
    );
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const access = await canSeePrivateDetails(viewer, id);
  if (!access) {
    return NextResponse.json(
      { error: "You can only view CVs of members in pods you lead." },
      { status: 403 },
    );
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("resume_path, full_name")
    .eq("member_id", id)
    .maybeSingle();
  const path = profile?.resume_path as string | undefined;
  if (!path) {
    return NextResponse.json({ error: "No CV on file yet." }, { status: 404 });
  }

  const ext = path.split(".").pop()?.toLowerCase();
  const name = `${
    String(profile?.full_name ?? "member")
      .replace(/[^a-zA-Z0-9 ._-]/g, "")
      .trim() || "member"
  } CV${ext && ext.length <= 4 ? `.${ext}` : ""}`;
  const { data, error } = await admin.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(path, 60, { download: name });
  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not open the CV." },
      { status: 500 },
    );
  }

  if (access !== "self") {
    await writeAudit({
      actorId: viewer.id,
      action: "member.cv_viewed",
      targetType: "member",
      targetId: id,
      metadata: { as: access },
    });
  }
  return NextResponse.redirect(data.signedUrl);
}
