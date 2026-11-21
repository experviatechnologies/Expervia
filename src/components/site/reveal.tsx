"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "up" | "left" | "right" | "zoom";

/**
 * Animate content in as it scrolls into view (fade + slight movement).
 *
 * Progressive enhancement: content is rendered visible. Only once this runs in
 * the browser, and only for elements still BELOW the fold, is it hidden and
 * then revealed on entry, so there is no flash for what is already on screen
 * and nothing stays hidden without JavaScript. Skipped entirely under
 * prefers-reduced-motion. Styles live in globals.css ([data-reveal]).
 *
 * `delay` (ms) staggers siblings, e.g. `delay={i * 80}` in a grid.
 */
export function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: "div" | "li" | "section" | "article";
  variant?: Variant;
  delay?: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already visible on load: leave it alone (no flash).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.dataset.state = "hidden";
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.dataset.state = "shown";
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal={variant}
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties)
          : undefined
      }
      className={cn(className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
