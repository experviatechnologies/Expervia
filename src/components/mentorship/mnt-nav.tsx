"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Public top navigation for the ETEN Mentorship landing, in the Expervia
 * site's new look (Nov 2026): the fixed night-indigo bar with the wordmark,
 * pill links and the two programme CTAs. Sits over the indigo hero, so pages
 * using it start with an 80px top offset (pt-20).
 *
 * Curriculum/Enterprise are in-page anchors and Mentorship is internal. Events
 * and Community leave the product for the main marketing site, so they are
 * absolute URLs: on the mentorship subdomain a relative "/events" or "/" would
 * be caught by the host rewrite and never reach the Expervia site.
 */
// Match the main site's Community nav target, made absolute for the subdomain.
const communityPath =
  siteConfig.navLinks.find((l) => l.title === "Community")?.href ??
  "/community/huawei";

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Mentors", href: "#mentors" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "FAQ", href: "#faq" },
  { label: "Events", href: `${siteConfig.url}/events` },
  { label: "Community", href: `${siteConfig.url}${communityPath}` },
];

const linkClass =
  "inline-flex items-center rounded-full px-3.5 py-2 text-[0.95rem] font-medium whitespace-nowrap text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";

export function MntNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // A slightly denser bar with a shadow once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b text-white backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "bg-night/95 border-white/10 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)]"
          : "border-transparent bg-transparent",
        open && "bg-night/95 border-white/10",
      )}
    >
      <a
        href="#main"
        className="bg-brand-600 sr-only rounded-md px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-10"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/mentorship"
          aria-label="ETEN Mentorship home"
          className="focus-visible:ring-brand-300 shrink-0 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-bold tracking-tight text-white">
              ETEN Mentorship
            </span>
            <span className="text-brand-200 mt-1 text-[0.62rem] font-semibold tracking-[0.22em] uppercase">
              By Expervia Technologies
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/mentorship/signin"
            className="hidden min-h-11 items-center px-2 text-sm font-semibold whitespace-nowrap text-white/80 transition hover:text-white md:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/mentorship/register?role=mentor"
            className="hidden min-h-11 items-center rounded-full border border-white/25 px-5 text-sm font-semibold whitespace-nowrap text-white transition hover:border-white/60 hover:bg-white/5 sm:inline-flex"
          >
            Become a Mentor
          </Link>
          <Link
            href="/mentorship/register?role=mentee"
            className="bg-brand-400 hover:bg-brand-500 hidden min-h-11 items-center rounded-full px-5 text-sm font-semibold whitespace-nowrap text-white shadow-[0_10px_30px_-12px_rgba(138,92,246,0.9)] transition md:inline-flex"
          >
            Apply as Mentee
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mnt-nav-menu"
            className="inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10 xl:hidden"
          >
            {open ? (
              <X aria-hidden className="size-6" />
            ) : (
              <Menu aria-hidden className="size-6" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mnt-nav-menu"
          className="bg-night max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-white/10 px-4 pt-2 pb-6 sm:px-6 xl:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((l) => (
              <li key={l.label} className="border-b border-white/5">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-3.5 text-base font-medium text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="border-b border-white/5">
              <Link
                href="/mentorship/signin"
                onClick={() => setOpen(false)}
                className="block px-2 py-3.5 text-base font-medium text-white"
              >
                Sign in
              </Link>
            </li>
          </ul>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/mentorship/register?role=mentor"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 font-semibold text-white hover:bg-white/5"
            >
              Become a Mentor
            </Link>
            <Link
              href="/mentorship/register?role=mentee"
              onClick={() => setOpen(false)}
              className="bg-brand-400 hover:bg-brand-500 inline-flex min-h-12 items-center justify-center rounded-full font-semibold text-white"
            >
              Apply as Mentee
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
