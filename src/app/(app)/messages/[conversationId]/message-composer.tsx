"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessage } from "../actions";

export function MessageComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await sendMessage({ conversationId, body });
      if ("error" in res) setError(res.error);
      else setBody("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="border-eten-line bg-eten-panel-hi text-eten-ink placeholder:text-eten-faint focus:border-eten-accent max-h-40 min-h-[2.75rem] w-full resize-y rounded-xl border p-3 text-sm outline-none"
        />
        <Button
          type="submit"
          variant="eten"
          size="icon-sm"
          className="mb-0.5 shrink-0"
          disabled={pending || body.trim().length === 0}
          aria-label="Send"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </form>
  );
}
