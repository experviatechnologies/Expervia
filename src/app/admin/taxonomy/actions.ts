"use server";

import { revalidatePath } from "next/cache";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type ActionResult = { ok: true } | { error: string };

/** name -> url-safe slug (the stable key; ops edit the display name, not this). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Every action re-checks that the caller is an operations member. The proxy
 * already gates /admin, but Server Functions are reachable by direct POST, so we
 * verify here too (Next.js data-security guidance).
 */
async function ensureOps(): Promise<string | null> {
  const ops = await isOperations();
  return ops ? null : "You don't have permission to manage the taxonomy.";
}

export async function createSkill(input: {
  podId: string;
  name: string;
}): Promise<ActionResult> {
  const denied = await ensureOps();
  if (denied) return { error: denied };

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { error: "Enter a skill name (at least 2 characters)." };
  }
  if (name.length > 80) {
    return { error: "Skill names must be 80 characters or fewer." };
  }
  const slug = slugify(name);
  if (!slug) {
    return { error: "That name can't be turned into a valid slug." };
  }
  if (!input.podId) {
    return { error: "Missing pod." };
  }

  const { error } = await getSupabaseAdmin()
    .from("skills")
    .insert({ pod_id: input.podId, name, slug });

  if (error) {
    // 23505 = unique_violation on the global slug.
    if (error.code === "23505") {
      return { error: `A skill with the slug “${slug}” already exists.` };
    }
    return { error: "Couldn't add the skill. Please try again." };
  }

  revalidatePath("/admin/taxonomy");
  return { ok: true };
}

export async function renameSkill(input: {
  skillId: string;
  name: string;
}): Promise<ActionResult> {
  const denied = await ensureOps();
  if (denied) return { error: denied };

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { error: "Enter a skill name (at least 2 characters)." };
  }
  if (name.length > 80) {
    return { error: "Skill names must be 80 characters or fewer." };
  }

  // Slug is the stable key (posts/profiles reference it) — rename the label only.
  const { error } = await getSupabaseAdmin()
    .from("skills")
    .update({ name })
    .eq("id", input.skillId);

  if (error) return { error: "Couldn't rename the skill. Please try again." };

  revalidatePath("/admin/taxonomy");
  return { ok: true };
}

export async function setSkillActive(input: {
  skillId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const denied = await ensureOps();
  if (denied) return { error: denied };

  const { error } = await getSupabaseAdmin()
    .from("skills")
    .update({ is_active: input.isActive })
    .eq("id", input.skillId);

  if (error) return { error: "Couldn't update the skill. Please try again." };

  revalidatePath("/admin/taxonomy");
  return { ok: true };
}

export async function deleteSkill(input: {
  skillId: string;
}): Promise<ActionResult> {
  const denied = await ensureOps();
  if (denied) return { error: denied };

  // FKs cascade: member_skills and post_tags referencing this skill go with it.
  // Prefer deactivating a skill that's in use; delete is for taxonomy cleanup.
  const { error } = await getSupabaseAdmin()
    .from("skills")
    .delete()
    .eq("id", input.skillId);

  if (error) return { error: "Couldn't delete the skill. Please try again." };

  revalidatePath("/admin/taxonomy");
  return { ok: true };
}
