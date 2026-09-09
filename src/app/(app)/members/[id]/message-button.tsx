"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startConversation } from "../../messages/actions";

export function MessageButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setError(null);
    startTransition(async () => {
      const res = await startConversation({ otherMemberId: memberId });
      if ("error" in res) setError(res.error);
      else router.push(`/messages/${res.conversationId}`);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="eten"
        size="pill-sm"
        disabled={pending}
        onClick={open}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageSquare className="size-4" />
        )}
        Message
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
