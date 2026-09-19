import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { EvidenceCategory } from "@/lib/eten/evidence-types";

/**
 * Capability-passport evidence (M0.2). Attested records of demonstrated
 * capability. Written via service_role so trusted modules (the mentorship
 * mentor sign-off, ops manual entry) can attribute evidence to a member after
 * their own authorization check — members never self-add (see 14 RLS).
 */

export type EvidenceInput = {
  memberId: string;
  title: string;
  description?: string | null;
  category?: EvidenceCategory;
  capabilityArea?: string | null;
  vLevel?: number | null;
  sourceType?: string | null;
  sourceRef?: string | null;
  attributedTo?: string | null;
  issuedBy?: string | null;
  occurredAt?: string | null;
};

export async function addEvidenceRecord(
  input: EvidenceInput,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await getSupabaseAdmin()
    .from("evidence_records")
    .insert({
      member_id: input.memberId,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? "other",
      capability_area: input.capabilityArea ?? null,
      v_level: input.vLevel ?? null,
      source_type: input.sourceType ?? null,
      source_ref: input.sourceRef ?? null,
      attributed_to: input.attributedTo ?? null,
      issued_by: input.issuedBy ?? null,
      occurred_at: input.occurredAt ?? null,
    });
  if (error) return { error: error.message };
  return { ok: true };
}
