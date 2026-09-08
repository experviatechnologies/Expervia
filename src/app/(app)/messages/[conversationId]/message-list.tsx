"use client";

import { useEffect, useRef } from "react";
import { timeAgo } from "@/lib/time";

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

/**
 * Scrollable message pane that keeps the newest message in view — it jumps to
 * the bottom on first load and whenever a new message arrives (the standard
 * chat behaviour). The pane is the only thing that scrolls, so the composer and
 * header stay put.
 */
export function MessageList({
  messages,
  memberId,
}: {
  messages: ChatMessage[];
  memberId: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.length;

  useEffect(() => {
    // Instant on mount, smooth for subsequent new messages.
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4">
      {messages.length === 0 ? (
        <p className="text-on-surface-variant py-8 text-center text-sm">
          No messages yet. Say hello.
        </p>
      ) : (
        messages.map((m) => {
          const mine = m.senderId === memberId;
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
                <p className="text-sm break-words whitespace-pre-line">
                  {m.body}
                </p>
                <p
                  className={
                    mine
                      ? "text-primary-foreground/70 mt-1 text-right text-[10px]"
                      : "text-on-surface-variant mt-1 text-[10px]"
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
