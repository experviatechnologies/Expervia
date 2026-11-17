"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FAQ disclosure list in the Join ETEN style: divided rows, a round "+" that
 * turns into a filled "×" when open. One item open at a time; the first is
 * open by default. Each row is a real button with aria-expanded/controls.
 */
export function FaqList({
  items,
  onOpen,
}: {
  items: readonly { question: string; answer: string }[];
  /** Called with the 0-based index when an item is opened. */
  onOpen?: (index: number) => void;
}) {
  const base = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-brand-100 border-brand-100 divide-y border-y">
      {items.map((item, i) => {
        const expanded = open === i;
        const qId = `${base}-q${i}`;
        const aId = `${base}-a${i}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={qId}
                type="button"
                aria-expanded={expanded}
                aria-controls={aId}
                onClick={() => {
                  setOpen(expanded ? null : i);
                  if (!expanded) onOpen?.(i);
                }}
                className="text-brand-950 hover:text-brand-700 focus-visible:ring-brand-400 flex w-full items-center justify-between gap-6 rounded-lg py-5 text-left text-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition duration-300",
                    expanded
                      ? "border-brand-700 bg-brand-700 rotate-45 text-white"
                      : "border-brand-200 text-brand-700",
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={aId}
              role="region"
              aria-labelledby={qId}
              hidden={!expanded}
              className="text-ink/75 pr-12 pb-6 text-[1.02rem] leading-relaxed"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
