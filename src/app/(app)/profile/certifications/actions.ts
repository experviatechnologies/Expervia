"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { removeCertificateFile } from "./shared";

type ActionResult = { ok: true } | { error: string };

// Add/update carry a file (up to 10 MB), which exceeds the 1 MB Server Action
// body limit, so they live in the POST /api/member/certificate route instead.
// Delete carries only an id, so it stays a Server Action.
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
