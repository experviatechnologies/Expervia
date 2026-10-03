"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, GraduationCap } from "lucide-react";
import { siteConfig } from "@/config/site";

/**
 * Public top navigation for the ETEN Mentorship landing, re-skinned to the
 * proposed design: the nav links (Curriculum, Mentorship, Events, Enterprise,
 * Community) plus the two programme CTAs. No person/account icon. Uses the
 * mnt-* brand palette with the Expervia marketing type scale.
 *
 * Curriculum/Enterprise are in-page anchors and Mentorship is internal. Events
 * and Community leave the product for the main marketing site, so they are
 * absolute URLs: on the mentorship subdomain a relative "/events" or "/" would
 * be caught by the host rewrite and never reach the Expervia site.
 */
// Match the main site's Community nav target (its mega-menu links here), made
// absolute so it works from the subdomain too.
const communityPath =
  siteConfig.navLinks.find((l) => l.title === "Community")?.href ??
  "/community/huawei";

const NAV = [
  { label: "Curriculum", href: "#how" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "Events", href: `${siteConfig.url}/events` },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Community", href: `${siteConfig.url}${communityPath}` },
];

// Compact pill CTAs (match Expervia's pill-sm: 14px, tight padding) so the bar
// does not crowd. Icons live on the hero CTAs, not here.
const btnBrand =
  "inline-flex items-center justify-center rounded-full bg-mnt-brand px-4 py-2 text-sm font-bold whitespace-nowrap text-mnt-on-brand transition hover:brightness-110";
const btnOutline =
  "inline-flex items-center justify-center rounded-full border border-mnt-line-strong px-4 py-2 text-sm font-bold whitespace-nowrap text-mnt-ink transition hover:border-mnt-brand";

export function MntNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-mnt-line bg-mnt-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1140px] items-center justify-between gap-4 px-6">
        <Link href="/mentorship" className="flex shrink-0 items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-8 place-items-center rounded-[9px] bg-gradient-to-br text-[15px] font-extrabold">
            E
          </span>
          <span className="text-mnt-ink font-display text-lg font-extrabold whitespace-nowrap">
            ETEN Mentorship
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-body-md text-mnt-muted hover:text-mnt-ink whitespace-nowrap transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/mentorship/register?role=mentor"
            className={btnOutline + " hidden md:inline-flex"}
          >
            Become a Mentor
          </Link>
          <Link
            href="/mentorship/register?role=mentee"
            className={btnBrand + " hidden md:inline-flex"}
          >
            Apply as Mentee
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mnt-nav-menu"
            className="text-mnt-ink -mr-1 grid size-10 place-items-center rounded-lg lg:hidden"
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
                href="/mentorship/register?role=mentor"
                onClick={() => setOpen(false)}
                className={btnOutline + " py-2.5"}
              >
                <GraduationCap className="mr-2 size-4" aria-hidden="true" />
                Become a Mentor
              </Link>
              <Link
                href="/mentorship/register?role=mentee"
                onClick={() => setOpen(false)}
                className={btnBrand + " py-2.5"}
              >
                Apply as Mentee
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
