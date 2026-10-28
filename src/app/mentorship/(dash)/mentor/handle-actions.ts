"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export type HandleResult = { ok: true; handle: string } | { error: string };

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

// Paths we don't want a handle to shadow or be confused with.
const RESERVED = new Set([
  "admin",
  "api",
  "auth",
  "book",
  "m",
  "mentor",
  "mentors",
  "mentorship",
  "dashboard",
  "login",
  "signin",
  "signup",
  "register",
  "settings",
  "profile",
  "new",
  "search",
  "help",
  "support",
]);

/**
 * A verified mentor claims (or updates) their public booking handle, used at
 * /m/<handle>. Normalised to lower case, validated as a slug, reserved words
 * blocked, and checked for case-insensitive uniqueness against other mentors.
 * An empty value clears the handle.
 */
export async function saveMentorHandle(raw: string): Promise<HandleResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const admin = getSupabaseAdmin();
  const { data: mp } = await admin
    .from("mentor_profiles")
    .select("mentor_status")
    .eq("member_id", me.id)
    .maybeSingle();
  if (!mp || mp.mentor_status === "candidate") {
    return { error: "Only verified mentors can set a booking link." };
  }

  const handle = (raw ?? "").trim().toLowerCase();

  // Clear the handle.
  if (handle === "") {
    const { error } = await admin
      .from("mentor_profiles")
      .update({ handle: null })
      .eq("member_id", me.id);
    if (error) return { error: "Couldn't update your link. Please try again." };
    revalidatePath("/mentorship/mentor");
    return { ok: true, handle: "" };
  }

  if (!HANDLE_RE.test(handle)) {
    return {
      error:
        "Use 2–31 characters: lowercase letters, numbers and hyphens, starting with a letter or number.",
    };
  }
  if (RESERVED.has(handle)) {
    return { error: "That link is reserved. Please choose another." };
  }

  const { data: taken } = await admin
    .from("mentor_profiles")
    .select("member_id")
    .ilike("handle", handle)
    .neq("member_id", me.id)
    .maybeSingle();
  if (taken) {
    return { error: "That link is already taken. Please choose another." };
  }

  const { error } = await admin
    .from("mentor_profiles")
    .update({ handle })
    .eq("member_id", me.id);
  if (error) {
    if (error.code === "23505") {
      return { error: "That link is already taken. Please choose another." };
    }
    return { error: "Couldn't update your link. Please try again." };
  }

  revalidatePath("/mentorship/mentor");
  return { ok: true, handle };
}
