"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { requestMentorship } from "./actions";

type Status = "pending" | "accepted" | "declined" | null;

export function RequestControl({
  mentorId,
  initialStatus,
  canRequest,
}: {
  mentorId: string;
  initialStatus: Status;
  canRequest: boolean;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (status === "accepted") {
    return (
      <span className="text-mnt-green inline-flex items-center gap-1 text-[13px] font-semibold">
        <Check className="size-4" />
        Mentoring you
      </span>
    );
  }
  if (status === "pending") {
    return <span className="text-mnt-faint text-[13px]">Request sent</span>;
  }

  if (!canRequest) {
    return (
      <Link
        href="/mentorship/validate"
        className="text-mnt-brand text-[13px] font-semibold"
      >
        Validate to request
      </Link>
    );
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await requestMentorship({ mentorId, message });
      if ("error" in res) setError(res.error);
      else {
        setStatus("pending");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-mnt-brand text-mnt-on-brand rounded-full px-4 py-2 text-[13px] font-bold transition hover:brightness-110"
      >
        Request mentorship
      </button>
    );
  }

  return (
    <div className="w-full">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Introduce yourself and what you'd like help with (optional)."
        className="border-mnt-line bg-mnt-panel-2 text-mnt-ink focus:border-mnt-brand w-full rounded-[10px] border px-3 py-2 text-[13px] transition-colors outline-none placeholder:text-[#586273]"
      />
      {error && <p className="text-destructive mt-1 text-[12px]">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-mnt-brand text-mnt-on-brand rounded-full px-4 py-2 text-[13px] font-bold transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="text-mnt-faint hover:text-mnt-ink px-2 text-[13px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
