import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Lightweight rate limiting with no extra table: count a member's own recent
 * rows in the target table within a sliding window. Read via service_role so the
 * count is accurate regardless of RLS visibility. Returns true if the action is
 * ALLOWED (under the limit), false if it should be throttled.
 *
 * Best-effort: if the count query errors, we allow the action rather than block
 * a legitimate member on an infra hiccup. These ceilings are set high enough to
 * be invisible in normal use and only catch automated flooding.
 */
export async function withinRateLimit(params: {
  table: string;
  column: string;
  memberId: string;
  windowSeconds: number;
  max: number;
}): Promise<boolean> {
  const since = new Date(
    Date.now() - params.windowSeconds * 1000,
  ).toISOString();
  try {
    const { count, error } = await getSupabaseAdmin()
      .from(params.table)
      .select("*", { count: "exact", head: true })
      .eq(params.column, params.memberId)
      .gte("created_at", since);
    if (error) return true;
    return (count ?? 0) < params.max;
  } catch {
    return true;
  }
}

export const TOO_FAST =
  "You're doing that too quickly. Please wait a moment and try again.";
