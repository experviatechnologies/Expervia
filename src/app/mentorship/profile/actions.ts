"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type ActionResult = { ok: true } | { error: string };

/**
 * Updates the caller's mentorship-facing profile: headline, bio and skills. Kept
 * separate from the member-app updateProfile so it only touches these fields and
 * never clobbers the member's name, pod or other profile data. Writes via
 * service_role after verifying the caller (the skills taxonomy and member_skills
 * reads are RLS-gated behind validation, so service_role keeps the diff correct
 * for any tier); member_id is always scoped to the caller.
 */
export async function updateMentorProfile(input: {
  headline: string;
  bio: string;
  skillIds: string[];
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "Your session has expired. Please sign in." };
  if (member.status !== "active")
    return { error: "Your account isn't active." };

  const admin = getSupabaseAdmin();

  const headline = input.headline?.trim().slice(0, 160) || null;
  const bio = input.bio?.trim().slice(0, 2000) || null;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ headline, bio })
    .eq("member_id", member.id);
  if (profileError) {
    return { error: "We couldn't save your profile. Please try again." };
  }

  // Keep only real, active skill ids.
  const selected = new Set((input.skillIds ?? []).filter(Boolean).slice(0, 60));
  const { data: validRows } = selected.size
    ? await admin
        .from("skills")
        .select("id")
        .in("id", [...selected])
        .eq("is_active", true)
    : { data: [] };
  const finalSelected = new Set((validRows ?? []).map((s) => s.id));

  const { data: existingRows } = await admin
    .from("member_skills")
    .select("skill_id")
    .eq("member_id", member.id);
  const existing = new Set((existingRows ?? []).map((r) => r.skill_id));

  const toAdd = [...finalSelected].filter((id) => !existing.has(id));
  const toRemove = [...existing].filter((id) => !finalSelected.has(id));

  if (toAdd.length) {
    const { error } = await admin
      .from("member_skills")
      .insert(toAdd.map((skill_id) => ({ member_id: member.id, skill_id })));
    if (error) {
      return {
        error: "Your details saved, but some skills didn't. Try again.",
      };
    }
  }
  if (toRemove.length) {
    const { error } = await admin
      .from("member_skills")
      .delete()
      .eq("member_id", member.id)
      .in("skill_id", toRemove);
    if (error) {
      return { error: "Your details saved, but removing a skill failed." };
    }
  }

  revalidatePath("/mentorship/profile");
  revalidatePath("/mentorship/mentor");
  revalidatePath("/mentorship/dashboard");
  return { ok: true };
}
