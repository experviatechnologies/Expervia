"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type ProfileInput = {
  fullName: string;
  headline: string;
  jobTitle: string;
  location: string;
  industryExperience: string;
  availabilityStatus: string;
  bio: string;
  languages: string[];
  yearsExperience: number | null;
  primaryPodId: string | null;
  skillIds: string[];
};

type ActionResult = { ok: true } | { error: string };

/** Empty/whitespace → null, so optional text columns stay clean. */
function orNull(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Save the signed-in member's own profile. Written with the member's session
 * client, so RLS (profiles.update-self, member_skills.insert/delete-self) is the
 * enforcer. Re-verifies the caller — Server Functions are reachable by direct
 * POST (Next.js data-security guidance).
 */
export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const fullName = input.fullName?.trim();
  if (!fullName || fullName.length < 2) {
    return { error: "Please enter your full name." };
  }
  if (fullName.length > 120) {
    return { error: "Your name is too long (120 characters max)." };
  }

  let yearsExperience = input.yearsExperience;
  if (yearsExperience != null) {
    if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
      return { error: "Years of experience must be a positive number." };
    }
    yearsExperience = Math.min(Math.floor(yearsExperience), 70);
  }

  const languages = (input.languages ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);

  const supabase = await createSupabaseServerClient();

  // Validate the chosen primary pod is a real specialist pod (not Main).
  let primaryPodId: string | null = null;
  if (input.primaryPodId) {
    const { data: pod } = await supabase
      .from("pods")
      .select("id, is_main")
      .eq("id", input.primaryPodId)
      .maybeSingle();
    if (!pod || pod.is_main) {
      return { error: "That pod isn't available. Please pick another." };
    }
    primaryPodId = pod.id;
  }

  // 1) Update the profile row.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      headline: orNull(input.headline),
      job_title: orNull(input.jobTitle),
      location: orNull(input.location),
      industry_experience: orNull(input.industryExperience),
      availability_status: orNull(input.availabilityStatus),
      bio: orNull(input.bio),
      languages: languages.length ? languages : null,
      years_experience: yearsExperience,
      primary_specialization_pod_id: primaryPodId,
    })
    .eq("member_id", member.id);
  if (profileError) {
    return { error: "We couldn't save your profile. Please try again." };
  }

  // Keep the member joined to their primary pod (leaving pods lands in M2).
  if (primaryPodId) {
    await supabase
      .from("pod_memberships")
      .upsert(
        { pod_id: primaryPodId, member_id: member.id, role_in_pod: "member" },
        { onConflict: "pod_id,member_id", ignoreDuplicates: true },
      );
  }

  // 2) Reconcile secondary skills against what's already saved (add/remove diff).
  const selected = new Set((input.skillIds ?? []).filter(Boolean).slice(0, 60));
  const { data: existingRows } = await supabase
    .from("member_skills")
    .select("skill_id")
    .eq("member_id", member.id);
  const existing = new Set((existingRows ?? []).map((r) => r.skill_id));

  const toAdd = [...selected].filter((id) => !existing.has(id));
  const toRemove = [...existing].filter((id) => !selected.has(id));

  if (toAdd.length) {
    const { error } = await supabase
      .from("member_skills")
      .insert(toAdd.map((skill_id) => ({ member_id: member.id, skill_id })));
    if (error) {
      return {
        error: "Your details saved, but some skills didn't. Please try again.",
      };
    }
  }
  if (toRemove.length) {
    const { error } = await supabase
      .from("member_skills")
      .delete()
      .eq("member_id", member.id)
      .in("skill_id", toRemove);
    if (error) {
      return {
        error: "Your details saved, but removing a skill failed. Try again.",
      };
    }
  }

  revalidatePath("/profile");
  return { ok: true };
}
