"use server";

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Complete a member's first-run setup: record their primary specialist pod,
 * join that pod, and save any secondary skills.
 *
 * Everything here is written with the member's OWN session client, so RLS is
 * the real enforcer:
 *   - profiles.update-self          → primary_specialization_pod_id
 *   - pod_memberships.join-self     → role_in_pod = 'member' only
 *   - member_skills.insert-self     → member_id = auth.uid()
 *
 * Per the Next.js data-security guidance, a Server Function is reachable by a
 * direct POST, so we re-verify the caller here rather than trusting the page.
 */
export async function completeOnboarding(input: {
  primaryPodId: string;
  secondaryPodIds?: string[];
  skillIds: string[];
}): Promise<{ error: string } | void> {
  const member = await getCurrentMember();
  if (!member) {
    return { error: "Your session has expired. Please sign in again." };
  }
  if (member.status !== "active") {
    return {
      error: "Your account isn't active. Please contact the ETEN team.",
    };
  }
  if (!member.emailConfirmed) {
    return { error: "Confirm your email to activate your account first." };
  }

  const primaryPodId = input.primaryPodId?.trim();
  if (!primaryPodId) {
    return { error: "Please choose your primary pod." };
  }

  const supabase = await createSupabaseServerClient();

  // Validate every chosen pod against the real specialist pods (not Main). This
  // covers both the primary and any secondary pods, so a crafted id can't slip
  // through — RLS still enforces join-self on the membership rows below.
  const { data: specialistPods } = await supabase
    .from("pods")
    .select("id")
    .eq("is_main", false);
  const validPodIds = new Set((specialistPods ?? []).map((p) => p.id));
  if (!validPodIds.has(primaryPodId)) {
    return { error: "That pod isn't available. Please pick another." };
  }

  // Secondary pods: keep only valid specialist pods, drop the primary and dups.
  const secondaryPodIds = Array.from(new Set(input.secondaryPodIds ?? []))
    .filter((id) => id && id !== primaryPodId && validPodIds.has(id))
    .slice(0, 20);

  // 1) Record the primary specialization on the profile.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ primary_specialization_pod_id: primaryPodId })
    .eq("member_id", member.id);
  if (profileError) {
    return { error: "We couldn't save your pod. Please try again." };
  }

  // 2) Join the primary + any secondary pods (idempotent — re-running
  // onboarding won't duplicate). All join as plain members; RLS join-self
  // forbids self-assigning a lead role.
  const membershipRows = [primaryPodId, ...secondaryPodIds].map((pod_id) => ({
    pod_id,
    member_id: member.id,
    role_in_pod: "member" as const,
  }));
  const { error: joinError } = await supabase
    .from("pod_memberships")
    .upsert(membershipRows, {
      onConflict: "pod_id,member_id",
      ignoreDuplicates: true,
    });
  if (joinError) {
    return { error: "We couldn't add you to the pod. Please try again." };
  }

  // 3) Save secondary skills (optional). Deduped and capped defensively.
  const skillIds = Array.from(new Set(input.skillIds ?? []))
    .filter(Boolean)
    .slice(0, 50);
  if (skillIds.length > 0) {
    const rows = skillIds.map((skill_id) => ({
      member_id: member.id,
      skill_id,
    }));
    const { error: skillError } = await supabase
      .from("member_skills")
      .upsert(rows, {
        onConflict: "member_id,skill_id",
        ignoreDuplicates: true,
      });
    if (skillError) {
      return {
        error:
          "We saved your pod, but some skills didn't save. You can add them later from your profile.",
      };
    }
  }

  // Success — leave first-run setup for the dashboard.
  redirect("/dashboard");
}
