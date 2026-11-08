import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { missingDetails, type DetailsSnapshot } from "./member-details";

/**
 * A member's required details as stored (profiles + member_contact), read
 * with service_role after the caller's identity is verified. Cached per
 * request so the app gate and the page share one read.
 */
export const loadDetails = cache(
  async (memberId: string): Promise<DetailsSnapshot> => {
    const admin = getSupabaseAdmin();
    const [{ data: p }, { data: c, error: cError }] = await Promise.all([
      admin
        .from("profiles")
        .select("full_name, location, job_title, years_experience, resume_path")
        .eq("member_id", memberId)
        .maybeSingle(),
      admin
        .from("member_contact")
        .select("phone, consent_at")
        .eq("member_id", memberId)
        .maybeSingle(),
    ]);
    // Migration 59 not run yet: treat contact details as present so the app
    // never locks everyone out because of a missing table.
    const pending = Boolean(cError);
    return {
      fullName: (p?.full_name as string) ?? null,
      phone: pending ? "pending-migration" : ((c?.phone as string) ?? null),
      location: (p?.location as string) ?? null,
      jobTitle: (p?.job_title as string) ?? null,
      yearsExperience: (p?.years_experience as number | null) ?? null,
      hasCv: Boolean(p?.resume_path),
      consentAt: pending
        ? "pending-migration"
        : ((c?.consent_at as string) ?? null),
    };
  },
);

/** True when the member still has required details to give. */
export async function needsDetails(memberId: string): Promise<boolean> {
  return missingDetails(await loadDetails(memberId)).length > 0;
}
