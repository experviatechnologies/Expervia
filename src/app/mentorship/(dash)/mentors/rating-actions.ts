"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { canRateMentor } from "@/lib/eten/ratings";

type ActionResult = { ok: true } | { error: string };

/**
 * A mentee rates a mentor (1-5 stars + optional review). Allowed only after a
 * real mentoring relationship (accepted booking or shared Circle). One rating
 * per mentee+mentor; submitting again updates it.
 */
export async function rateMentor(input: {
  mentorId: string;
  rating: number;
  review?: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (input.mentorId === me.id) {
    return { error: "You can't rate yourself." };
  }

  const rating = Math.round(Number(input.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choose a rating from 1 to 5 stars." };
  }
  const review = (input.review ?? "").trim().slice(0, 1000) || null;

  const admin = getSupabaseAdmin();

  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", input.mentorId)
    .maybeSingle();
  if (!mp || mp.mentor_status === "candidate") {
    return { error: "That mentor isn't available." };
  }

  if (!(await canRateMentor(admin, me.id, input.mentorId))) {
    return { error: "You can rate a mentor after a session with them." };
  }

  const { error } = await admin.from("mentor_ratings").upsert(
    {
      mentor_id: input.mentorId,
      mentee_id: me.id,
      rating,
      review,
    },
    { onConflict: "mentor_id,mentee_id" },
  );
  if (error) return { error: "Couldn't save your rating. Please try again." };

  await notify({
    recipientId: input.mentorId,
    actorId: me.id,
    type: "mentorship",
    targetType: "mentor_rated",
    targetId: null,
  });

  revalidatePath(`/mentorship/mentors/${input.mentorId}`);
  revalidatePath("/mentorship/mentors");
  return { ok: true };
}
