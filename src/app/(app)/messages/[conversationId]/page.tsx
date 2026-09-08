import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";
import { MessageComposer } from "./message-composer";
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

  const messages = msgRows ?? [];

  // Mark read now that we're viewing it.
  await markConversationRead({ conversationId });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="text-on-surface-variant hover:text-on-surface inline-flex size-9 items-center justify-center rounded-full"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {otherId ? (
          <Link
            href={`/members/${otherId}`}
            className="flex items-center gap-3 hover:underline"
          >
            <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-sm font-bold">
              {title.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-on-surface font-semibold">{title}</span>
          </Link>
        ) : (
          <span className="text-on-surface font-semibold">{title}</span>
        )}
      </header>

      <div className="flex flex-1 flex-col justify-end gap-3 py-4">
        {messages.length === 0 ? (
          <p className="text-on-surface-variant py-8 text-center text-sm">
            No messages yet. Say hello.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === member.id;
            return (
              <div
                key={m.id}
                className={mine ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    mine
                      ? "bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2"
                      : "bg-surface-container text-on-surface max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2"
                  }
                >
                  <p className="text-sm whitespace-pre-line">{m.body}</p>
                  <p
                    className={
                      mine
                        ? "text-primary-foreground/70 mt-1 text-right text-[10px]"
                        : "text-on-surface-variant mt-1 text-[10px]"
                    }
                  >
                    {timeAgo(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-background/80 sticky bottom-0 pt-2 pb-4 backdrop-blur">
        <MessageComposer conversationId={conversationId} />
      </div>
    </div>
  );
}
