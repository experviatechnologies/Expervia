"use client";

import { useRef, useState, useTransition } from "react";
import { BarChart3, ImagePlus, Loader2, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "./actions";

export type ComposerTarget = { id: string; name: string };
export type ComposerTag = { id: string; name: string };

const MAX_BODY = 5000;
const MAX_TAGS = 5;

export function PostComposer({
  targets,
  tagOptions,
  embedded = false,
  onPosted,
}: {
  targets: ComposerTarget[];
  tagOptions: ComposerTag[];
  /** Rendered inside a modal (drops the standalone card chrome). */
  embedded?: boolean;
  /** Called after a successful post (e.g. to close the modal). */
  onPosted?: () => void;
}) {
  const [body, setBody] = useState("");
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length >= MAX_TAGS
          ? prev
          : [...prev, id],
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("body", body);
    formData.set("targetPodId", targetId);
    if (image) formData.set("image", image);
    for (const id of tagIds) formData.append("tags", id);
    if (pollOptions) {
      for (const opt of pollOptions) {
        if (opt.trim()) formData.append("pollOptions", opt);
      }
    }
    startTransition(async () => {
      const res = await createPost(formData);
      if ("error" in res) setError(res.error);
      else {
        setBody("");
        clearImage();
        setTagIds([]);
        setPollOptions(null);
        onPosted?.();
      }
    });
  }

  function setPollOption(i: number, value: string) {
    setPollOptions((prev) => {
      const next = [...(prev ?? [])];
      next[i] = value;
      return next;
    });
  }

  function clearImage() {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const over = body.length > MAX_BODY;
  const canPost = body.trim().length > 0 && !over && Boolean(targetId);

  return (
    <form
      onSubmit={submit}
      className={embedded ? "" : "glass-card mb-8 rounded-2xl p-5"}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Share an update, a question, or something you're working on…"
        className="text-eten-ink placeholder:text-eten-faint w-full resize-y bg-transparent text-sm outline-none"
      />

      {image && (
        <div className="border-eten-line text-eten-ink-muted mt-2 flex items-center gap-2 rounded-lg border p-2 text-sm">
          <ImagePlus className="text-eten-accent size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{image.name}</span>
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove image"
            className="hover:text-eten-ink"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {tagOptions.length > 0 && (
        <div className="mt-3">
          <p className="text-eten-faint mb-1.5 text-xs">
            Tags {tagIds.length > 0 && `(${tagIds.length}/${MAX_TAGS})`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tagOptions.map((tag) => {
              const on = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    on
                      ? "border-eten-accent/50 bg-eten-accent-soft rounded-full border px-2.5 py-1 text-xs font-medium text-[#cddcfb]"
                      : "border-eten-line text-eten-ink-muted hover:text-eten-ink rounded-full border px-2.5 py-1 text-xs transition-colors"
                  }
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {pollOptions && (
        <div className="border-eten-line mt-3 flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-eten-ink-muted text-xs font-medium">
              Poll options
            </p>
            <button
              type="button"
              onClick={() => setPollOptions(null)}
              aria-label="Remove poll"
              className="text-eten-faint hover:text-eten-ink"
            >
              <X className="size-4" />
            </button>
          </div>
          {pollOptions.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => setPollOption(i, e.target.value)}
              maxLength={200}
              placeholder={`Option ${i + 1}`}
              className="border-eten-line bg-eten-panel-hi text-eten-ink placeholder:text-eten-faint focus:border-eten-accent w-full rounded-lg border p-2 text-sm outline-none"
            />
          ))}
          {pollOptions.length < 6 && (
            <button
              type="button"
              onClick={() => setPollOptions((prev) => [...(prev ?? []), ""])}
              className="text-eten-accent inline-flex items-center gap-1 self-start text-xs font-medium"
            >
              <Plus className="size-3.5" />
              Add option
            </button>
          )}
        </div>
      )}

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

      <div className="border-eten-line mt-3 flex flex-col gap-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="text-eten-ink-muted flex shrink-0 items-center gap-2 text-sm">
            <span className="whitespace-nowrap">Post to</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent min-w-0 rounded-lg border px-3 py-1.5 text-sm outline-none"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 text-sm"
            title="Attach an image"
          >
            <ImagePlus className="size-4" />
            Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => setPollOptions((prev) => (prev ? null : ["", ""]))}
            className={
              pollOptions
                ? "text-eten-accent inline-flex items-center gap-1.5 text-sm"
                : "text-eten-ink-muted hover:text-eten-ink inline-flex items-center gap-1.5 text-sm"
            }
            title="Add a poll"
          >
            <BarChart3 className="size-4" />
            Poll
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={
              over ? "text-destructive text-xs" : "text-eten-faint text-xs"
            }
          >
            {body.length}/{MAX_BODY}
          </span>
          <Button
            type="submit"
            variant="eten"
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
