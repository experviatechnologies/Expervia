"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";
import { addEvidenceRecord } from "@/lib/eten/evidence";
import {
  EVIDENCE_CATEGORIES,
  type EvidenceCategory,
} from "@/lib/eten/evidence-types";
import { recordRecognition } from "@/lib/eten/recognition";
import { BADGE_BY_KEY } from "@/lib/eten/recognition-types";

type MemberStatus = "active" | "suspended" | "deactivated";
type ActionResult = { ok: true } | { error: string };

const VALID: MemberStatus[] = ["active", "suspended", "deactivated"];

/**
 * Change a member's account status (suspend / reactivate / deactivate).
 * Ops-only, re-verified here. Guards against foot-guns:
 *   - can't act on your own account (self-lockout)
 *   - can't suspend/deactivate another operations account
 * Written with service_role after the checks (mirrors the rest of /admin);
 * RLS members_update_ops would also allow it, but this keeps the admin path
 * uniform.
 */
export async function setMemberStatus(input: {
  memberId: string;
  status: MemberStatus;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage members." };
  }
  if (!VALID.includes(input.status)) {
    return { error: "Invalid status." };
  }

  const me = await getCurrentMember();
  if (me && me.id === input.memberId) {
    return { error: "You can't change your own account status." };
  }

  const admin = getSupabaseAdmin();

  const { data: target } = await admin
    .from("members")
    .select("id, role")
    .eq("id", input.memberId)
    .maybeSingle();
  if (!target) return { error: "That member no longer exists." };
  if (target.role === "operations") {
    return {
      error: "Operations accounts can't be suspended from here.",
    };
  }

  const { error } = await admin
    .from("members")
    .update({ status: input.status })
    .eq("id", input.memberId);
  if (error) {
    return { error: "Couldn't update the member. Please try again." };
  }

  await writeAudit({
    actorId: me?.id ?? null,
    action: `member.status.${input.status}`,
    targetType: "member",
    targetId: input.memberId,
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

/**
 * Set a member's ETEN readiness level (V0–V5). Ops-only (the Verification Desk
 * / Readiness Panel decision), audit-logged. Written with service_role after
 * the ops check, mirroring setMemberStatus.
 */
export async function setMemberVLevel(input: {
  memberId: string;
  vLevel: number;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to set V-levels." };
  }
  if (!Number.isInteger(input.vLevel) || input.vLevel < 0 || input.vLevel > 5) {
    return { error: "V-level must be between 0 and 5." };
  }

  const me = await getCurrentMember();
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("members")
    .update({ v_level: input.vLevel })
    .eq("id", input.memberId);
  if (error) {
    return { error: "Couldn't update the V-level. Please try again." };
  }

  await writeAudit({
    actorId: me?.id ?? null,
    action: "member.v_level",
    targetType: "member",
    targetId: input.memberId,
    metadata: { v_level: input.vLevel },
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

/**
 * Add an attested capability-passport evidence record for a member. Ops-only,
 * audit-logged. Members can never self-add (integrity); this is the manual
 * ops entry path — the mentorship module will write records the same way.
 */
export async function addMemberEvidence(input: {
  memberId: string;
  title: string;
  description?: string;
  category?: string;
  capabilityArea?: string;
  vLevel?: number | null;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to add evidence." };
  }
  const title = input.title?.trim();
  if (!title) return { error: "A title is required." };
  if (title.length > 200) return { error: "That title is too long (200 max)." };

  const category = EVIDENCE_CATEGORIES.includes(
    input.category as EvidenceCategory,
  )
    ? (input.category as EvidenceCategory)
    : "other";
  const vLevel =
    typeof input.vLevel === "number" &&
    Number.isInteger(input.vLevel) &&
    input.vLevel >= 0 &&
    input.vLevel <= 5
      ? input.vLevel
      : null;

  const me = await getCurrentMember();
  const res = await addEvidenceRecord({
    memberId: input.memberId,
    title,
    description: input.description?.trim() || null,
    category,
    capabilityArea: input.capabilityArea?.trim() || null,
    vLevel,
    sourceType: "manual",
    issuedBy: me?.id ?? null,
  });
  if ("error" in res) {
    return { error: "Couldn't add the evidence record. Please try again." };
  }

  await writeAudit({
    actorId: me?.id ?? null,
    action: "member.evidence_added",
    targetType: "member",
    targetId: input.memberId,
  });

  revalidatePath(`/admin/members/${input.memberId}`);
  return { ok: true };
}

/**
 * Award recognition to a member — a badge or an Expert Score credit. Ops-only,
 * audit-logged. Members never self-award; the mentorship module awards the same
 * way (via service_role) later.
 */
export async function addMemberRecognition(input: {
  memberId: string;
  kind: "badge" | "score_credit";
  badgeKey?: string;
  points?: number;
  label?: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to award recognition." };
  }

  const me = await getCurrentMember();

  if (input.kind === "badge") {
    const badge = input.badgeKey ? BADGE_BY_KEY[input.badgeKey] : undefined;
    if (!badge) return { error: "Choose a valid badge." };
    const res = await recordRecognition({
      memberId: input.memberId,
      kind: "badge",
      badgeKey: badge.key,
      label: input.label?.trim() || badge.label,
      sourceType: "manual",
      awardedBy: me?.id ?? null,
    });
    if ("error" in res) {
      return { error: "Couldn't award the badge. Please try again." };
    }
  } else {
    const points = Math.trunc(Number(input.points));
    if (!Number.isFinite(points) || points === 0) {
      return { error: "Enter a non-zero points value." };
    }
    const label = input.label?.trim();
    if (!label) return { error: "A reason/label is required." };
    const res = await recordRecognition({
      memberId: input.memberId,
      kind: "score_credit",
      points,
      label,
      sourceType: "manual",
      awardedBy: me?.id ?? null,
    });
    if ("error" in res) {
      return { error: "Couldn't award the credit. Please try again." };
    }
  }

  await writeAudit({
    actorId: me?.id ?? null,
    action: "member.recognition_awarded",
    targetType: "member",
    targetId: input.memberId,
  });

  revalidatePath(`/admin/members/${input.memberId}`);
  return { ok: true };
}
