"use client";

import { useState, useTransition } from "react";
import { Mail, Check } from "lucide-react";
import { sendDocumentReminder } from "./actions";

export function SendReminderControl({
  memberId,
  hasEmail,
}: {
  memberId: string;
  hasEmail: boolean;
}) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasEmail) {
    return <span className="text-eten-faint text-xs">No email</span>;
  }

  if (sent) {
    return (
      <span className="text-eten-verified inline-flex items-center gap-1 text-xs font-medium">
        <Check className="size-3.5" />
        Sent
      </span>
    );
  }

  function onClick() {
    setError(null);
    start(async () => {
      const res = await sendDocumentReminder(memberId);
      if ("error" in res) setError(res.error);
      else setSent(true);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="border-eten-line text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        <Mail className="size-3.5" />
        {pending ? "Sending…" : "Send reminder"}
      </button>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </span>
  );
}
