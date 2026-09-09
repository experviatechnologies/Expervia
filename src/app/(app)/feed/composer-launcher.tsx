"use client";

import { useEffect, useState } from "react";
import { PenLine, X } from "lucide-react";
import {
  PostComposer,
  type ComposerTarget,
  type ComposerTag,
} from "./post-composer";

/**
 * Community-style posting: a slim "Start a post" trigger at the top of the feed
 * and a floating compose button (so you can post from anywhere without scrolling
 * up), both opening a focused modal composer. Matches the pattern used by
 * workspace/community tools (Circle, Slack threads) rather than a large always-on
 * header composer.
 */
export function ComposerLauncher({
  targets,
  tagOptions,
}: {
  targets: ComposerTarget[];
  tagOptions: ComposerTag[];
}) {
  const [open, setOpen] = useState(false);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Slim trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-eten-panel border-eten-line text-eten-faint hover:text-eten-ink hover:border-eten-faint mb-5 flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-colors"
      >
        <PenLine className="text-eten-accent size-5 shrink-0" />
        Share an update, a question, or something you&apos;re working on…
      </button>

      {/* Floating compose button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New post"
        className="bg-eten-accent hover:bg-eten-accent-press fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-8px_rgba(79,134,236,.7)] transition-all hover:scale-105 active:scale-95 md:hidden"
      >
        <PenLine className="size-6" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="New post"
        >
          <div
            className="bg-eten-panel border-eten-line my-8 w-full max-w-xl rounded-2xl border p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-body-lg text-eten-ink font-bold">
                New post
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-eten-faint hover:text-eten-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <PostComposer
              targets={targets}
              tagOptions={tagOptions}
              embedded
              onPosted={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
