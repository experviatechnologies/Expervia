"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";

type ActionResult = { ok: true } | { error: string };

/**
 * A member self-applies to become a verified mentor in a capability area
 * (pod-free path). Creates a source='self' entry in mentor_nominations; the
 * ETEN Readiness Panel (ops) decides in /admin/mentors. One open application
 * per member (enforced by the partial unique index).
 */
export async function applyAsMentor(input: {
  capabilityAreaSlug: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };

  const admin = getSupabaseAdmin();
  const slug = input.capabilityAreaSlug?.trim();
  if (!slug) return { error: "Choose a capability area." };

  const { data: area } = await admin
    .from("capability_areas")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!area) return { error: "Choose a valid capability area." };

  // Mentoring is for full ETEN members. A Prospect must validate first.
  const { data: m } = await admin
    .from("members")
    .select("validated_at")
    .eq("id", me.id)
    .maybeSingle();
  if (!m?.validated_at) {
    return {
      error: "Validate your ETEN membership before applying to mentor.",
    };
  }

  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", me.id)
    .maybeSingle();
  if (mp?.mentor_status === "verified") {
    return { error: "You are already a verified mentor." };
  }

  const { error } = await admin.from("mentor_nominations").insert({
    member_id: me.id,
    capability_area_id: area.id,
    pod_id: null,
    nominated_by: me.id,
    source: "self",
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "You already have an application under review." };
    }
    return { error: "Couldn't submit your application. Please try again." };
  }

  await writeAudit({
    actorId: me.id,
    action: "mentor.nominated",
    targetType: "member",
    targetId: me.id,
    metadata: { source: "self" },
  });

  revalidatePath("/mentorship/mentor");
  return { ok: true };
}
