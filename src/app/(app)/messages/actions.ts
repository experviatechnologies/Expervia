"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/eten/notifications";
import { withinRateLimit, TOO_FAST } from "@/lib/eten/rate-limit";

type StartResult = { conversationId: string } | { error: string };
type ActionResult = { ok: true } | { error: string };

const MAX_MESSAGE = 5000;

/**
 * Open (or create) the 1:1 conversation between the caller and another member.
 *
 * Creation runs via service_role: the conv_participants_insert RLS check reads
 * `conversations` under RLS, which hides a conversation until you're already a
 * participant — so adding the first participant to a brand-new conversation
 * can't be done through the member session. We enforce the same guarantees in
 * code first (both active, neither blocked), then create with service_role.
 * Messaging itself still rides RLS.
 */
export async function startConversation(input: {
  otherMemberId: string;
}): Promise<StartResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };
  if (input.otherMemberId === me.id) {
    return { error: "You can't message yourself." };
  }

  const admin = getSupabaseAdmin();

  const { data: target } = await admin
    .from("members")
    .select("id, status, claimed_at")
    .eq("id", input.otherMemberId)
    .maybeSingle();
  if (!target || target.status !== "active" || !target.claimed_at) {
    return { error: "That member isn't available to message." };
  }

  // Block in either direction stops the conversation.
  const { data: blocks } = await admin
    .from("blocks")
    .select("blocker_id")
    .in("blocker_id", [me.id, input.otherMemberId])
    .in("blocked_id", [me.id, input.otherMemberId]);
  if ((blocks ?? []).length > 0) {
    return { error: "You can't message this member." };
  }

  // Reuse an existing 1:1 conversation if there is one.
  const { data: mine } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("member_id", me.id);
  const myConvIds = (mine ?? []).map((r) => r.conversation_id);

  if (myConvIds.length > 0) {
    const { data: shared } = await admin
      .from("conversation_participants")
      .select("conversation_id, conversations(is_group)")
      .eq("member_id", input.otherMemberId)
      .in("conversation_id", myConvIds);
    const existing = (shared ?? []).find(
      (r) =>
        !(r as unknown as { conversations: { is_group: boolean } | null })
          .conversations?.is_group,
    );
    if (existing) return { conversationId: existing.conversation_id };
  }

  const conversationId = crypto.randomUUID();
  const { error: convError } = await admin
    .from("conversations")
    .insert({ id: conversationId, is_group: false, created_by: me.id });
  if (convError) return { error: "Couldn't start the conversation." };

  const { error: partError } = await admin
    .from("conversation_participants")
    .insert([
      { conversation_id: conversationId, member_id: me.id },
      { conversation_id: conversationId, member_id: input.otherMemberId },
    ]);
  if (partError) {
    await admin.from("conversations").delete().eq("id", conversationId);
    return { error: "Couldn't start the conversation." };
  }

  return { conversationId };
}

/** Send a message. RLS enforces participant + no block; sender must be self. */
export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };
  if (me.status !== "active") return { error: "Your account isn't active." };

  const body = input.body.trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > MAX_MESSAGE) {
    return { error: `Messages are limited to ${MAX_MESSAGE} characters.` };
  }

  if (
    !(await withinRateLimit({
      table: "messages",
      column: "sender_id",
      memberId: me.id,
      windowSeconds: 60,
      max: 60,
    }))
  ) {
    return { error: TOO_FAST };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: me.id,
    body,
  });
  if (error) {
    // Most likely a block landed between opening and sending.
    return {
      error: "Couldn't send. You may no longer be able to message here.",
    };
  }

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", input.conversationId)
    .eq("member_id", me.id);

  // Notify the other participant(s). Service_role read of the roster + writes.
  const admin = getSupabaseAdmin();
  const { data: participants } = await admin
    .from("conversation_participants")
    .select("member_id")
    .eq("conversation_id", input.conversationId);
  for (const p of participants ?? []) {
    if (p.member_id !== me.id) {
      await notify({
        recipientId: p.member_id,
        actorId: me.id,
        type: "message",
        targetType: "conversation",
        targetId: input.conversationId,
      });
    }
  }

  revalidatePath(`/messages/${input.conversationId}`);
  revalidatePath("/messages");
  return { ok: true };
}

/** Mark a conversation read up to now (drives unread counts). */
export async function markConversationRead(input: {
  conversationId: string;
}): Promise<ActionResult> {
  const me = await getCurrentMember();
  if (!me) return { error: "You need to sign in." };

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", input.conversationId)
    .eq("member_id", me.id);

  revalidatePath("/messages");
  return { ok: true };
}
