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
        className="glass-card text-on-surface-variant hover:text-on-surface mb-6 flex w-full items-center gap-3 rounded-2xl p-4 text-left text-sm transition-colors"
      >
        <PenLine className="text-primary size-5 shrink-0" />
        Share an update, a question, or something you&apos;re working on…
      </button>

      {/* Floating compose button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New post"
        className="bg-primary text-primary-foreground fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 md:right-8 md:bottom-8"
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
            className="glass-card bg-surface my-8 w-full max-w-xl rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-body-lg text-on-surface font-bold">
                New post
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-on-surface-variant hover:text-on-surface"
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
