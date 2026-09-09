"use client";

import { useEffect, useRef, useState } from "react";
import { timeAgo } from "@/lib/time";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

/**
 * Scrollable message pane with live updates. Subscribes to INSERTs on this
 * conversation's messages via Supabase Realtime (which honours RLS, so only a
 * participant receives them) and appends new ones as they arrive — the sender's
 * own message still lands via the server re-render, and de-dup by id keeps them
 * from doubling. Always keeps the newest message in view.
 *
 * Realtime requires the `messages` table in the supabase_realtime publication
 * (supabase/eten/09_realtime.sql); without it, messages still appear on the next
 * navigation/refresh — this only adds the live push.
 */
export function MessageList({
  messages,
  memberId,
  conversationId,
}: {
  messages: ChatMessage[];
  memberId: string;
  conversationId: string;
}) {
  // Only realtime-received messages live in state; the server list stays the
  // source of truth and is merged with these at render (de-duped by id). This
  // avoids syncing props into state.
  const [live, setLive] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          setLive((prev) =>
            prev.some((x) => x.id === m.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: m.id,
                    senderId: m.sender_id,
                    body: m.body,
                    createdAt: m.created_at,
                  },
                ],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const byId = new Map<string, ChatMessage>();
  for (const m of messages) byId.set(m.id, m);
  for (const m of live) if (!byId.has(m.id)) byId.set(m.id, m);
  const items = [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, live.length]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4">
      {items.length === 0 ? (
        <p className="text-eten-faint py-8 text-center text-sm">
          No messages yet. Say hello.
        </p>
      ) : (
        items.map((m) => {
          const mine = m.senderId === memberId;
          return (
            <div
              key={m.id}
              className={mine ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  mine
                    ? "bg-eten-accent max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2 text-white"
                    : "bg-eten-panel-hi text-eten-ink max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2"
                }
              >
                <p className="text-sm break-words whitespace-pre-line">
                  {m.body}
                </p>
                <p
                  className={
                    mine
                      ? "mt-1 text-right text-[10px] text-white/70"
                      : "text-eten-faint mt-1 text-[10px]"
                  }
                >
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}
