"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WIT_JOIN_HREF, witSections } from "@/config/women-in-tech";
import { TrackedLink } from "./tracking";

/**
 * Sticky in-page navigation (PRD 8 / FR-08). Sits under the fixed site navbar,
 * highlights the section in view, and keeps the Join CTA reachable on mobile.
 */
export function WitSectionNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = witSections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A band across the upper part of the viewport, below both sticky bars.
      { rootMargin: "-140px 0px -55% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Women in Tech sections"
      className="bg-surface/85 sticky top-20 z-40 border-y border-white/10 backdrop-blur-xl"
    >
      <div className="px-margin-mobile md:px-margin-desktop mx-auto flex h-14 max-w-7xl items-center gap-4">
        <ul className="-mx-2 flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {witSections.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={cn(
                  "focus-visible:ring-primary block rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2",
                  active === s.id
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <TrackedLink
          href={WIT_JOIN_HREF}
          event="women_in_tech_join_click"
          location="section_nav"
          className="bg-brand text-brand-foreground focus-visible:ring-primary shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none"
        >
          Join
        </TrackedLink>
      </div>
    </nav>
  );
}
