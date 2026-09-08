"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "./actions";

export type ComposerTarget = { id: string; name: string };

const MAX_BODY = 5000;

export function PostComposer({ targets }: { targets: ComposerTarget[] }) {
  const [body, setBody] = useState("");
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createPost({ body, targetPodId: targetId });
      if ("error" in res) setError(res.error);
      else setBody("");
    });
  }

  const over = body.length > MAX_BODY;
  const canPost = body.trim().length > 0 && !over && Boolean(targetId);

  return (
    <form onSubmit={submit} className="glass-card mb-8 rounded-2xl p-5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Share an update, a question, or something you're working on…"
        className="text-on-surface placeholder:text-on-surface-variant/60 w-full resize-y bg-transparent text-sm outline-none"
      />

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

      <div className="border-outline-variant mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <label className="text-on-surface-variant flex items-center gap-2 text-sm">
          Post to
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="border-outline-variant bg-surface text-on-surface focus:border-primary rounded-lg border px-3 py-1.5 text-sm outline-none"
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3">
          <span
            className={
              over
                ? "text-destructive text-xs"
                : "text-on-surface-variant/60 text-xs"
            }
          >
            {body.length}/{MAX_BODY}
          </span>
          <Button
            type="submit"
            variant="brand"
            size="pill-sm"
            disabled={pending || !canPost}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
