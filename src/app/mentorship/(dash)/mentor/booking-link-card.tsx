"use client";

import { useState, useTransition } from "react";
import { Check, Link2 } from "lucide-react";
import { ShareLink } from "@/components/shared/share-link";
import { saveMentorHandle } from "./handle-actions";

export function BookingLinkCard({
  mentorId,
  initialHandle,
  origin,
}: {
  mentorId: string;
  initialHandle: string | null;
  origin: string;
}) {
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialHandle ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const host = origin.replace(/^https?:\/\//, "");
  const url = handle
    ? `${origin}/m/${handle}`
    : `${origin}/mentorship/book/${mentorId}`;

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await saveMentorHandle(draft);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setHandle(res.handle);
      setEditing(false);
      setSaved(true);
    });
  }

  return (
    <section className="bg-mnt-panel border-mnt-line flex flex-col gap-4 rounded-2xl border p-5">
      <div className="flex items-center gap-2.5">
        <span className="bg-mnt-brand/10 text-mnt-brand grid size-9 place-items-center rounded-xl">
          <Link2 className="size-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-mnt-ink text-[15px] font-bold">
            Your booking link
          </h2>
          <p className="text-mnt-ink-muted text-[13px]">
            Share this so anyone can book a session with you, no account needed.
          </p>
        </div>
      </div>

      <ShareLink
        url={url}
        variant="panel"
        message="Book a session with me on ETEN:"
      />

      {editing ? (
        <div className="flex flex-col gap-2">
          <label className="text-mnt-ink text-[13px] font-semibold">
            Custom link
          </label>
          <div className="border-mnt-line bg-mnt-panel-2 focus-within:border-mnt-brand flex h-[46px] items-center rounded-xl border px-3">
            <span className="text-mnt-faint text-[13px] whitespace-nowrap">
              {host}/m/
            </span>
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              placeholder="yourname"
              autoCapitalize="none"
              spellCheck={false}
              className="text-mnt-ink min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none"
            />
          </div>
          <p className="text-mnt-ink-muted text-[12px]">
            Lowercase letters, numbers and hyphens. Leave empty to remove your
            custom link.
          </p>
          {error && (
            <div
              role="alert"
              className="rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-red-600 [background:rgba(239,68,68,0.1)] dark:text-red-400"
            >
              {error}
            </div>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="bg-mnt-brand text-mnt-on-brand h-[42px] flex-1 rounded-xl text-[14px] font-bold transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="border-mnt-line text-mnt-ink-muted hover:border-mnt-brand hover:text-mnt-ink h-[42px] rounded-xl border px-4 text-[14px] font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(handle);
              setEditing(true);
            }}
            className="border-mnt-line text-mnt-ink hover:border-mnt-brand h-[42px] rounded-xl border px-4 text-[14px] font-semibold transition"
          >
            {handle ? "Change your link" : "Create a custom link"}
          </button>
          {saved && (
            <span className="text-mnt-green inline-flex items-center gap-1.5 text-[13px] font-semibold">
              <Check className="size-4" strokeWidth={2.4} /> Saved
            </span>
          )}
        </div>
      )}
    </section>
  );
}
