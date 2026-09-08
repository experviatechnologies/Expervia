"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ActionResult = { ok: true } | { error: string };

/**
 * Join a pod as an ordinary member. Writes through the member's OWN session
 * client so RLS enforces it: pod_memberships_join_self only permits an insert
 * where member_id = auth.uid() and role_in_pod = 'member' (no self-appointing to
 * lead). The unique (pod_id, member_id) constraint makes a double-join a no-op.
 */
export async function joinPod(input: { podId: string }): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };
  if (member.status !== "active") {
    return { error: "Your account isn't active." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pod_memberships").insert({
    pod_id: input.podId,
    member_id: member.id,
    role_in_pod: "member",
  });

  // 23505 = already a member; treat as success (idempotent join).
  if (error && error.code !== "23505") {
    return { error: "Couldn't join the pod. Please try again." };
  }

  revalidatePath("/pods");
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}

/**
 * Leave a pod. RLS pod_memberships_leave allows deleting your own row. The
 * member's PRIMARY specialization pod can't be left here — that membership is
 * tied to their profile identity and onboarding; changing it belongs on the
 * profile editor, not a casual "leave".
 */
export async function leavePod(input: {
  podId: string;
}): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "You need to sign in." };

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_specialization_pod_id")
    .eq("member_id", member.id)
    .maybeSingle();

  if (profile?.primary_specialization_pod_id === input.podId) {
    return {
      error:
        "This is your primary specialization pod. Change it from your profile first.",
    };
  }

  const { error } = await supabase
    .from("pod_memberships")
    .delete()
    .eq("pod_id", input.podId)
    .eq("member_id", member.id);

  if (error) {
    return { error: "Couldn't leave the pod. Please try again." };
  }

  revalidatePath("/pods");
  revalidatePath("/pods/[slug]", "page");
  return { ok: true };
}
