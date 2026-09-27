"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, GraduationCap } from "lucide-react";

/**
 * Public top navigation for the ETEN Mentorship landing, re-skinned to the
 * proposed design: the nav links (Curriculum, Mentorship, Events, Enterprise,
 * Community) plus the two programme CTAs. No person/account icon. Nav links
 * point to existing pages or in-page sections for now. Uses the mnt-* brand
 * palette with the Expervia marketing type scale (text-body-md).
 */
const NAV = [
  { label: "Curriculum", href: "#how" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "Events", href: "/events" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Community", href: "/" },
];

const btnBrand =
  "inline-flex items-center gap-2 rounded-full bg-mnt-brand px-4 py-2.5 text-body-md font-bold text-mnt-on-brand transition hover:brightness-110";
const btnOutline =
  "inline-flex items-center gap-2 rounded-full border border-mnt-line-strong px-4 py-2.5 text-body-md font-bold text-mnt-ink transition hover:border-mnt-brand";

export function MntNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-mnt-line bg-mnt-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1140px] items-center justify-between px-6">
        <Link href="/mentorship" className="flex items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-9 place-items-center rounded-[10px] bg-gradient-to-br text-base font-extrabold">
            E
          </span>
          <span className="text-mnt-ink font-display text-headline-md font-bold">
            ETEN Mentorship
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-body-md text-mnt-muted hover:text-mnt-ink transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/mentorship/register"
            className={btnOutline + " hidden md:inline-flex"}
          >
            <GraduationCap className="size-4" aria-hidden="true" />
            Become a Mentor
          </Link>
          <Link
            href="/mentorship/register"
            className={btnBrand + " hidden md:inline-flex"}
          >
            Apply as Mentee
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mnt-nav-menu"
            className="text-mnt-ink grid size-10 place-items-center rounded-lg lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {open && (
        <div
          id="mnt-nav-menu"
          className="border-mnt-line bg-mnt-bg border-t lg:hidden"
        >
          <div className="mx-auto flex max-w-[1140px] flex-col gap-1 px-6 py-4">
            {NAV.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-body-md text-mnt-ink-muted hover:text-mnt-ink rounded-lg px-3 py-2.5 font-medium transition-colors hover:bg-white/[0.03]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2.5">
              <Link
                href="/mentorship/register"
                onClick={() => setOpen(false)}
                className={btnOutline + " justify-center"}
              >
                <GraduationCap className="size-4" aria-hidden="true" />
                Become a Mentor
              </Link>
              <Link
                href="/mentorship/register"
                onClick={() => setOpen(false)}
                className={btnBrand + " justify-center"}
              >
                Apply as Mentee
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
