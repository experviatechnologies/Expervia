import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service_role key. This bypasses Row
// Level Security, so it must NEVER be imported into a Client Component or any
// code that ships to the browser — only Route Handlers / server code.
//
// Lazily instantiated (same pattern as getResendClient) so a missing env var
// can never crash the build at module-load time.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const APPLICATIONS_TABLE = "community_applications";
export const RESUMES_BUCKET = "resumes";

export type CommunityApplication = {
  vendor: "huawei" | "microsoft";
  fullName: string;
  email: string;
  phone?: string | null;
  linkedin?: string | null;
  location?: string | null;
  solutionArea?: string | null;
  certifications?: string | null;
  availability?: string | null;
};

// Uploads the resume to the private `resumes` bucket and inserts a row into
// `community_applications`. Called from Route Handlers only. Returns the stored
// object path so the caller can log/reference it.
export async function saveApplication(
  application: CommunityApplication,
  resume: File,
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const safeName = resume.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${application.vendor}/${crypto.randomUUID()}-${safeName}`;

  // Read the File into a Buffer before uploading. Passing the web File object
  // straight to storage upload makes undici attempt a streaming request body,
  // which fails with an opaque "fetch failed" under the Node runtime. A Buffer
  // is sent as a plain (non-streaming) body and uploads reliably.
  const bytes = Buffer.from(await resume.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(RESUMES_BUCKET)
    .upload(objectPath, bytes, {
      contentType: resume.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Resume upload failed: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase
    .from(APPLICATIONS_TABLE)
    .insert({
      vendor: application.vendor,
      full_name: application.fullName,
      email: application.email,
      phone: application.phone ?? null,
      linkedin: application.linkedin ?? null,
      location: application.location ?? null,
      solution_area: application.solutionArea ?? null,
      certifications: application.certifications ?? null,
      availability: application.availability ?? null,
      resume_path: objectPath,
    });

  if (insertError) {
    throw new Error(`Application insert failed: ${insertError.message}`);
  }

  return objectPath;
}
