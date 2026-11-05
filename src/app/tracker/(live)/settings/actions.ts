"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { authorizeTracker } from "@/lib/tracker/server/session";
import { auditTracker } from "@/lib/tracker/server/events";
import { TIMEZONES } from "@/lib/tracker/time";
import type { Seniority, SkillLevel } from "@/lib/tracker/types";

/**
 * Expertise profile, live (Phase 4, step 4.4; PRD FR-006, FR-007).
 *
 * Writes the caller's own records only:
 *   presales_profiles  phone, time zone, seniority, specialisations,
 *                      industries, opted_in
 *   profiles           bio, years of experience (the ETEN profile, shared)
 *   member_skills      skills from the approved taxonomy, with a level
 * Pods and certifications are managed on their existing ETEN pages (pod
 * rules and certificate verification live there) and are not changed here.
 */

type Result = { ok: true } | { error: string };

const SENIORITY: Seniority[] = ["associate", "mid", "senior", "principal"];
const LEVELS: SkillLevel[] = ["foundational", "working", "advanced", "expert"];

const list = (v: unknown, max: number) =>
  Array.isArray(v)
    ? v
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, max)
        .map((x) => x.slice(0, 80))
    : [];

export async function saveExpertiseProfile(input: {
  phone?: string;
  timezone?: string;
  bio?: string;
  seniority?: Seniority;
  years?: number;
  skills?: { skillId: string; level: SkillLevel }[];
  specialisations?: string[];
  industries?: string[];
  optedIn?: boolean;
}): Promise<Result> {
  const auth = await authorizeTracker();
  if ("error" in auth) return auth;
  const id = auth.session.member.id;
  const admin = getSupabaseAdmin();

  if (input.timezone && !TIMEZONES.includes(input.timezone)) {
    return { error: "Choose a supported time zone." };
  }
  if (input.seniority && !SENIORITY.includes(input.seniority)) {
    return { error: "Choose a seniority level." };
  }
  const years = Number(input.years);
  if (
    input.years !== undefined &&
    (!Number.isInteger(years) || years < 0 || years > 60)
  ) {
    return {
      error: "Years of experience must be a whole number from 0 to 60.",
    };
  }
  const bio = (input.bio ?? "").trim();
  if (bio.length > 1200)
    return { error: "Keep the biography under 1,200 characters." };

  // Skills must come from the taxonomy; keep at most one level per skill.
  const wanted = new Map<string, SkillLevel>();
  for (const s of input.skills ?? []) {
    if (typeof s?.skillId !== "string" || !LEVELS.includes(s.level)) {
      return { error: "Choose a level for each skill." };
    }
    wanted.set(s.skillId, s.level);
  }
  if (wanted.size > 40) return { error: "Choose up to 40 skills." };
  if (wanted.size > 0) {
    const { data: known, error } = await admin
      .from("skills")
      .select("id")
      .in("id", [...wanted.keys()]);
    if (error) return { error: "Couldn't check your skills. Try again." };
    if ((known ?? []).length !== wanted.size)
      return { error: "One of the skills is not in the approved list." };
  }

  await admin.rpc("ensure_presales_profile", { p_member_id: id });
  // Only fields that were sent are changed.
  const has = <K extends keyof typeof input>(k: K) => input[k] !== undefined;
  const presales: Record<string, unknown> = {};
  if (has("phone")) presales.phone = input.phone?.trim().slice(0, 40) || null;
  if (has("timezone")) presales.timezone = input.timezone || null;
  if (has("seniority")) presales.seniority = input.seniority || null;
  if (has("specialisations"))
    presales.specialisations = list(input.specialisations, 20);
  if (has("industries")) presales.industries = list(input.industries, 20);
  if (has("optedIn")) presales.opted_in = Boolean(input.optedIn);
  if (Object.keys(presales).length) {
    const { error } = await admin
      .from("presales_profiles")
      .update(presales)
      .eq("member_id", id);
    if (error) return { error: "Couldn't save your profile. Try again." };
  }

  const profile: Record<string, unknown> = {};
  if (has("bio")) profile.bio = bio || null;
  if (has("years")) profile.years_experience = years;
  if (Object.keys(profile).length) {
    const { error } = await admin
      .from("profiles")
      .update(profile)
      .eq("member_id", id);
    if (error) return { error: "Couldn't save your profile. Try again." };
  }

  if (input.timezone) {
    await admin
      .from("mentor_scheduling_prefs")
      .update({ timezone: input.timezone })
      .eq("member_id", id);
  }

  if (input.skills) {
    const { data: current, error } = await admin
      .from("member_skills")
      .select("skill_id, level")
      .eq("member_id", id);
    if (error) return { error: "Couldn't save your skills. Try again." };
    const have = new Map(
      (current ?? []).map((r) => [
        r.skill_id as string,
        r.level as SkillLevel | null,
      ]),
    );
    const removed = [...have.keys()].filter((k) => !wanted.has(k));
    if (removed.length) {
      const { error: delError } = await admin
        .from("member_skills")
        .delete()
        .eq("member_id", id)
        .in("skill_id", removed);
      if (delError) return { error: "Couldn't save your skills. Try again." };
    }
    const upserts = [...wanted]
      .filter(([k, level]) => have.get(k) !== level)
      .map(([skill_id, level]) => ({ member_id: id, skill_id, level }));
    if (upserts.length) {
      const { error: upError } = await admin
        .from("member_skills")
        .upsert(upserts, { onConflict: "member_id,skill_id" });
      if (upError) return { error: "Couldn't save your skills. Try again." };
    }
  }

  // PRD FR-029: profile changes are significant (they drive matching).
  await auditTracker({
    actorId: id,
    action: "profile_updated",
    targetType: "member",
    targetId: id,
    metadata: {
      fields: Object.keys(input).filter(
        (k) => input[k as keyof typeof input] !== undefined,
      ),
    },
  });
  revalidatePath("/tracker", "layout");
  return { ok: true };
}
