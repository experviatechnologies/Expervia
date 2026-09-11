import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, CERTIFICATES_BUCKET } from "@/lib/supabase";
import {
  orNull,
  dateOrNull,
  validateFile,
  uploadCertificate,
  removeCertificateFile,
} from "@/app/(app)/profile/certifications/shared";

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

/**
 * Creates or updates a certification (with an optional file).
 *
 * This lives in an API route, not a Server Action, so certificate files up to
 * 10 MB aren't rejected by the 1 MB Server Action body limit. The row is
 * written via the caller's own RLS client (insert/update-self); the guard
 * trigger forces verification fields to 'unverified' — members can't
 * self-verify. Presence of an `id` field means update; otherwise add.
 */
export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  const formData = await request.formData();

  const name = orNull(formData.get("name"));
  if (!name) {
    return NextResponse.json(
      { error: "A certification name is required." },
      { status: 400 },
    );
  }
  if (name.length > 160) {
    return NextResponse.json(
      { error: "That name is too long (160 max)." },
      { status: 400 },
    );
  }

  const dateObtained = dateOrNull(formData.get("dateObtained"));
  const expiryDate = dateOrNull(formData.get("expiryDate"));
  if (dateObtained === false || expiryDate === false) {
    return NextResponse.json(
      { error: "Please enter valid dates." },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  const fileError = validateFile(file);
  if (fileError) {
    return NextResponse.json({ error: fileError }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const id = orNull(formData.get("id"));

  if (id) {
    // Update. RLS returns only the caller's own row — this both fetches and
    // authorizes.
    const { data: existing } = await supabase
      .from("certifications")
      .select("id, certificate_path")
      .eq("id", id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "That certification no longer exists." },
        { status: 404 },
      );
    }

    let newPath: string | null | undefined; // undefined = leave file unchanged
    if (file && file.size > 0) {
      try {
        newPath = await uploadCertificate(member.id, file);
      } catch {
        return NextResponse.json(
          { error: "The file upload failed. Please try again." },
          { status: 500 },
        );
      }
    }

    const update: Record<string, unknown> = {
      name,
      issuer: orNull(formData.get("issuer")),
      credential_id: orNull(formData.get("credentialId")),
      date_obtained: dateObtained,
      expiry_date: expiryDate,
    };
    if (newPath !== undefined) update.certificate_path = newPath;

    const { error: updateError } = await supabase
      .from("certifications")
      .update(update)
      .eq("id", id);

    if (updateError) {
      if (newPath) await removeCertificateFile(newPath);
      return NextResponse.json(
        { error: "Couldn't update the certification. Please try again." },
        { status: 500 },
      );
    }

    // Replaced the file — the old object is now orphaned; clean it up.
    if (newPath && existing.certificate_path) {
      await removeCertificateFile(existing.certificate_path);
    }
  } else {
    // Add.
    let certificatePath: string | null = null;
    if (file && file.size > 0) {
      try {
        certificatePath = await uploadCertificate(member.id, file);
      } catch {
        return NextResponse.json(
          { error: "The file upload failed. Please try again." },
          { status: 500 },
        );
      }
    }

    const { error: insertError } = await supabase
      .from("certifications")
      .insert({
        member_id: member.id,
        name,
        issuer: orNull(formData.get("issuer")),
        credential_id: orNull(formData.get("credentialId")),
        date_obtained: dateObtained,
        expiry_date: expiryDate,
        certificate_path: certificatePath,
      });

    if (insertError) {
      if (certificatePath) await removeCertificateFile(certificatePath);
      return NextResponse.json(
        { error: "Couldn't save the certification. Please try again." },
        { status: 500 },
      );
    }
  }

  revalidatePath("/profile/certifications");
  return NextResponse.json({ ok: true });
}
