"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WIT_JOIN_HREF, witSections } from "@/config/women-in-tech";
import { TrackedLink } from "./tracking";

/**
 * Sticky "on this page" bar (PRD 8 / FR-08) in the new site style. Sits under
 * the fixed 80px site header, highlights the section in view, and keeps the
 * Join CTA reachable on mobile.
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
    <div className="border-brand-100 sticky top-20 z-40 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <span className="font-jakarta text-brand-950 hidden shrink-0 text-sm font-extrabold tracking-tight md:block">
          Women in Tech
        </span>
        <nav
          aria-label="On this page"
          className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap">
            {witSections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className={cn(
                    "focus-visible:ring-brand-400 inline-block rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    active === s.id
                      ? "bg-lavender text-brand-800 font-semibold"
                      : "text-ink/70 hover:bg-lavender hover:text-brand-800",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <TrackedLink
          href={WIT_JOIN_HREF}
          event="women_in_tech_join_click"
          location="section_nav"
          className="bg-brand-700 hover:bg-brand-600 focus-visible:ring-brand-400 shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Join
        </TrackedLink>
      </div>
    </div>
  );
}
