import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, VERIFICATIONS_BUCKET } from "@/lib/supabase";

/**
 * Member KYC document upload + view (Phase 6).
 *
 * POST submits an identity or address document: the file goes to the PRIVATE
 * `verifications` bucket via service_role (no member-facing storage policies —
 * same model as certificates), and the row is written through the caller's own
 * RLS client, where the guard trigger forces status = 'unverified'. A file up
 * to 10 MB uploads through this API route rather than a Server Action, so it
 * isn't blocked by the 1 MB Server Action body limit.
 *
 * GET streams the caller's OWN document as a short-lived signed URL — the path
 * is authorised against a verification row the caller can see (own, via RLS),
 * so a crafted path can't sign someone else's object.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const ID_DOCUMENT_TYPES = new Set(["passport", "drivers_license", "nin"]);

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }
  if (member.status !== "active") {
    return NextResponse.json(
      { error: "Your account isn't active." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const kind = formData.get("kind");
  if (kind !== "identity" && kind !== "address") {
    return NextResponse.json(
      { error: "Invalid document kind." },
      { status: 400 },
    );
  }

  let documentType: string | null = null;
  if (kind === "identity") {
    const dt = formData.get("documentType");
    if (typeof dt !== "string" || !ID_DOCUMENT_TYPES.has(dt)) {
      return NextResponse.json(
        { error: "Choose your ID document type." },
        { status: 400 },
      );
    }
    documentType = dt;
  }

  const entry = formData.get("file");
  const file = entry instanceof File ? entry : null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "Please attach a file." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "That file is over 10 MB. Please upload a smaller file." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Upload a PDF or an image (PNG, JPG, or WebP)." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdmin();

  // Replace an existing PENDING submission of the same kind (the partial unique
  // index allows only one). Remove its file and row first so re-upload works.
  const { data: pending } = await supabase
    .from("member_verifications")
    .select("id, file_path")
    .eq("member_id", member.id)
    .eq("kind", kind)
    .eq("status", "unverified")
    .maybeSingle();
  if (pending) {
    if (pending.file_path) {
      await admin.storage
        .from(VERIFICATIONS_BUCKET)
        .remove([pending.file_path]);
    }
    await supabase.from("member_verifications").delete().eq("id", pending.id);
  }

  // Upload the file.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${member.id}/${kind}/${crypto.randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(VERIFICATIONS_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: "The file upload failed. Please try again." },
      { status: 500 },
    );
  }

  // Insert the row via the member's RLS client (guard forces 'unverified').
  const { error: insertError } = await supabase
    .from("member_verifications")
    .insert({
      member_id: member.id,
      kind,
      document_type: documentType,
      file_path: objectPath,
    });
  if (insertError) {
    await admin.storage.from(VERIFICATIONS_BUCKET).remove([objectPath]);
    return NextResponse.json(
      { error: "Couldn't submit your document. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

  // RLS scopes this to the caller's own verification rows.
  const supabase = await createSupabaseServerClient();
  const { data: match } = await supabase
    .from("member_verifications")
    .select("id")
    .eq("file_path", path)
    .maybeSingle();
  if (!match) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(VERIFICATIONS_BUCKET)
    .createSignedUrl(path, 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }
  return NextResponse.redirect(data.signedUrl);
}
