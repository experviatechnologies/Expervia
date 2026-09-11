import "server-only";
import { getSupabaseAdmin, CERTIFICATES_BUCKET } from "@/lib/supabase";

/**
 * Shared certificate-upload helpers used by the upload route
 * (POST /api/member/certificate) and the delete Server Action (./actions).
 * Not a "use server" module — it exports plain helpers, not Server Actions —
 * and `server-only` keeps it off the client bundle.
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function orNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : null;
}

/** A date input value ("YYYY-MM-DD") or null. Rejects anything malformed. */
export function dateOrNull(
  value: FormDataEntryValue | null,
): string | null | false {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : false;
}

export function validateFile(file: File | null): string | null {
  if (!file || file.size === 0) return null; // file is optional
  if (file.size > MAX_FILE_BYTES) {
    return "That file is over 10 MB. Please upload a smaller file.";
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Upload a PDF or an image (PNG, JPG, or WebP).";
  }
  return null;
}

/**
 * Uploads a certificate file to the private bucket via service_role (there are
 * no member-facing storage policies yet — same model as résumés). Returns the
 * stored object path. Throws on failure so the caller can report it.
 */
export async function uploadCertificate(
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

export async function removeCertificateFile(path: string): Promise<void> {
  await getSupabaseAdmin().storage.from(CERTIFICATES_BUCKET).remove([path]);
}
