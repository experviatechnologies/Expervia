import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin, EVENT_MEDIA_BUCKET } from "@/lib/supabase";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Uploads an event flyer to the PUBLIC `event-media` bucket and returns its
 * object path + public URL. Ops-only. Kept out of the create/update Server
 * Actions so flyer files aren't capped by the Server Action body limit and so
 * the action stays a plain data write. The caller stores the returned `path`
 * on the event row and renders `url` via next/image.
 */
export async function POST(request: NextRequest) {
  const manager = await getCurrentManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOperations())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "No image was provided." },
      { status: 400 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a PNG, JPEG, or WebP image." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is too large (6 MB max)." },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `flyers/${crypto.randomUUID()}-${safeName}`;

  // Read into a Buffer first — passing the web File straight to storage upload
  // makes undici stream the body, which fails opaquely under the Node runtime.
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(EVENT_MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: "The image upload failed. Please try again." },
      { status: 500 },
    );
  }

  const { data } = admin.storage.from(EVENT_MEDIA_BUCKET).getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl });
}
