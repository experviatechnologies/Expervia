import { getSupabaseAdmin } from "@/lib/supabase";

type Admin = ReturnType<typeof getSupabaseAdmin>;

/**
 * Can this mentee rate this mentor? Only after they've actually been mentored:
 * an accepted 1:1 booking, or a Circle membership under that mentor.
 */
export async function canRateMentor(
  admin: Admin,
  menteeId: string,
  mentorId: string,
): Promise<boolean> {
  const { data: booking } = await admin
    .from("session_bookings")
    .select("id")
    .eq("mentee_id", menteeId)
    .eq("mentor_id", mentorId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();
  if (booking) return true;

  const { data: circles } = await admin
    .from("mentorship_circles")
    .select("id")
    .eq("mentor_id", mentorId);
  const ids = (circles ?? []).map((c) => c.id);
  if (!ids.length) return false;

  const { data: membership } = await admin
    .from("circle_memberships")
    .select("circle_id")
    .eq("member_id", menteeId)
    .in("circle_id", ids)
    .limit(1)
    .maybeSingle();
  return Boolean(membership);
}

export type RatingSummary = { avg: number; count: number };

/** Average (rounded to 1 dp) and count from a set of rating rows. */
export function summarizeRatings(rows: { rating: number }[]): RatingSummary {
  const count = rows.length;
  if (count === 0) return { avg: 0, count: 0 };
  const total = rows.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((total / count) * 10) / 10, count };
}
