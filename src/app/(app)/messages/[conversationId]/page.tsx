import type { Metadata } from "next";
import { after } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MessageComposer } from "./message-composer";
import { MessageList, type ChatMessage } from "./message-list";
import { markConversationRead } from "../actions";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // RLS returns the conversation only if I'm a participant.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, is_group, title")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) notFound();

  const [{ data: partRows }, { data: msgRows }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("member_id")
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  const otherId =
    (partRows ?? []).map((p) => p.member_id).find((id) => id !== member.id) ??
    null;

  const memberIds = [...new Set((partRows ?? []).map((p) => p.member_id))];
  const { data: nameRows } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", memberIds)
    : { data: [] };
  const nameById = new Map(
    (nameRows ?? []).map((n) => [n.member_id, n.full_name]),
  );
  const title = conversation.is_group
    ? (conversation.title ?? "Group conversation")
    : otherId
      ? (nameById.get(otherId) ?? "A member")
      : "Conversation";

  const messages: ChatMessage[] = (msgRows ?? []).map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    body: m.body,
    createdAt: m.created_at,
  }));

  // Mark read now that we're viewing it. Runs in after() — not during render —
  // because markConversationRead calls revalidatePath, which is not allowed
  // during a Server Component render (it throws, crashing the whole page).
  after(() => markConversationRead({ conversationId }));

  return (
    // Full-screen chat shell: fixed so the header and composer stay put while
    // only the message pane scrolls. On desktop it sits to the right of the
    // sidebar (md:left-60); on mobile it covers the tab bar (back button
    // returns to the list), the standard mobile-chat pattern.
    <div className="bg-eten-canvas fixed inset-0 z-40 flex flex-col md:left-64">
      <header className="border-eten-line bg-eten-rail/80 flex shrink-0 items-center gap-3 border-b px-4 py-3 backdrop-blur">
        <Link
          href="/messages"
          className="text-eten-faint hover:text-eten-ink inline-flex size-9 shrink-0 items-center justify-center rounded-full"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {otherId ? (
          <Link
            href={`/members/${otherId}`}
            className="flex min-w-0 items-center gap-3 hover:underline"
          >
            <span className="from-eten-accent grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br to-[#3257b8] text-sm font-bold text-white">
              {title.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-eten-ink truncate font-semibold">
              {title}
            </span>
          </Link>
        ) : (
          <span className="text-eten-ink truncate font-semibold">{title}</span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          memberId={member.id}
          conversationId={conversationId}
        />
      </div>

      <div className="border-eten-line bg-eten-rail/80 shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <MessageComposer conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
