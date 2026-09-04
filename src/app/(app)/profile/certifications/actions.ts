"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin, CERTIFICATES_BUCKET } from "@/lib/supabase";

type ActionResult = { ok: true } | { error: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function orNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : null;
}

/** A date input value ("YYYY-MM-DD") or null. Rejects anything malformed. */
function dateOrNull(value: FormDataEntryValue | null): string | null | false {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : false;
}

/**
 * Uploads a certificate file to the private bucket via service_role (there are
 * no member-facing storage policies yet — same model as résumés). Returns the
 * stored object path. Throws on failure so the caller can report it.
 */
async function uploadCertificate(
  memberId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${memberId}/${crypto.randomUUID()}-${safeName}`;
  // Buffer (not the File) — a streaming body fails opaquely under Node/undici.
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await getSupabaseAdmin()
    .storage.from(CERTIFICATES_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return objectPath;
}

async function removeCertificateFile(path: string): Promise<void> {
  await getSupabaseAdmin().storage.from(CERTIFICATES_BUCKET).remove([path]);
}

function validateFile(file: File | null): string | null {
  if (!file || file.size === 0) return null; // file is optional
  if (file.size > MAX_FILE_BYTES) {
    return "That file is over 10 MB. Please upload a smaller file.";
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Upload a PDF or an image (PNG, JPG, or WebP).";
  }
  return null;
}

export async function addCertification(
  formData: FormData,
): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member)
    return { error: "Your session has expired. Please sign in again." };

  const name = orNull(formData.get("name"));
  if (!name) return { error: "A certification name is required." };
  if (name.length > 160) return { error: "That name is too long (160 max)." };

  const dateObtained = dateOrNull(formData.get("dateObtained"));
  const expiryDate = dateOrNull(formData.get("expiryDate"));
  if (dateObtained === false || expiryDate === false) {
    return { error: "Please enter valid dates." };
  }

  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  const fileError = validateFile(file);
  if (fileError) return { error: fileError };

  let certificatePath: string | null = null;
  if (file && file.size > 0) {
    try {
      certificatePath = await uploadCertificate(member.id, file);
    } catch {
      return { error: "The file upload failed. Please try again." };
    }
  }

  // Row insert via the member's own RLS client (insert-self). The guard trigger
  // forces verification fields to 'unverified' — members can't self-verify.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("certifications").insert({
    member_id: member.id,
    name,
    issuer: orNull(formData.get("issuer")),
    credential_id: orNull(formData.get("credentialId")),
    date_obtained: dateObtained,
    expiry_date: expiryDate,
    certificate_path: certificatePath,
  });

  if (error) {
    if (certificatePath) await removeCertificateFile(certificatePath);
    return { error: "Couldn't save the certification. Please try again." };
  }

  revalidatePath("/profile/certifications");
  return { ok: true };
}

export async function updateCertification(
  formData: FormData,
): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member)
    return { error: "Your session has expired. Please sign in again." };

  const id = orNull(formData.get("id"));
  if (!id) return { error: "Missing certification." };

  const name = orNull(formData.get("name"));
  if (!name) return { error: "A certification name is required." };
  if (name.length > 160) return { error: "That name is too long (160 max)." };

  const dateObtained = dateOrNull(formData.get("dateObtained"));
  const expiryDate = dateOrNull(formData.get("expiryDate"));
  if (dateObtained === false || expiryDate === false) {
    return { error: "Please enter valid dates." };
  }

  const supabase = await createSupabaseServerClient();

  // RLS returns only the caller's own row — this both fetches and authorizes.
  const { data: existing } = await supabase
    .from("certifications")
    .select("id, certificate_path")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "That certification no longer exists." };

  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  const fileError = validateFile(file);
  if (fileError) return { error: fileError };

  let newPath: string | null | undefined; // undefined = leave file unchanged
  if (file && file.size > 0) {
    try {
      newPath = await uploadCertificate(member.id, file);
    } catch {
      return { error: "The file upload failed. Please try again." };
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

  const { error } = await supabase
    .from("certifications")
    .update(update)
    .eq("id", id);

  if (error) {
    if (newPath) await removeCertificateFile(newPath);
    return { error: "Couldn't update the certification. Please try again." };
  }

  // Replaced the file — the old object is now orphaned; clean it up.
  if (newPath && existing.certificate_path) {
    await removeCertificateFile(existing.certificate_path);
  }

  revalidatePath("/profile/certifications");
  return { ok: true };
}

export async function deleteCertification(input: {
  id: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member)
    return { error: "Your session has expired. Please sign in again." };
  if (!input.id) return { error: "Missing certification." };

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("certifications")
    .select("id, certificate_path")
    .eq("id", input.id)
    .maybeSingle();
  if (!existing) return { ok: true }; // already gone

  const { error } = await supabase
    .from("certifications")
    .delete()
    .eq("id", input.id);
  if (error) return { error: "Couldn't delete the certification. Try again." };

  if (existing.certificate_path) {
    await removeCertificateFile(existing.certificate_path);
  }

  revalidatePath("/profile/certifications");
  return { ok: true };
}
