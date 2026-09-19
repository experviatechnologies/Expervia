import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { RecognitionKind } from "@/lib/eten/recognition-types";

/**
 * Recognition writes (M0.3). Append-only badge / score-credit events, written
 * via service_role so trusted modules (mentorship M4, ops manual award) can
 * attribute recognition after their own authz — members never self-award
 * (see 15 RLS).
 */

export type RecognitionInput = {
  memberId: string;
  kind: RecognitionKind;
  label: string;
  badgeKey?: string | null;
  points?: number | null;
  sourceType?: string | null;
  sourceRef?: string | null;
  awardedBy?: string | null;
};

export async function recordRecognition(
  input: RecognitionInput,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await getSupabaseAdmin()
    .from("recognition_events")
    .insert({
      member_id: input.memberId,
      kind: input.kind,
      label: input.label,
      badge_key: input.kind === "badge" ? (input.badgeKey ?? null) : null,
      points: input.kind === "score_credit" ? (input.points ?? 0) : null,
      source_type: input.sourceType ?? null,
      source_ref: input.sourceRef ?? null,
      awarded_by: input.awardedBy ?? null,
    });
  if (error) return { error: error.message };
  return { ok: true };
}
