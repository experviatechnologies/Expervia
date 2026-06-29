"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Route links (e.g. /about) are active on their page; in-page anchor links
  // (#solutions…) act as the active item on the homepage only.
  const isActive = (href: string, index: number) =>
    href.startsWith("/") ? pathname === href : pathname === "/" && index === 0;

  return (
    <nav className="bg-surface/60 fixed top-0 z-50 w-full border-b border-white/10 shadow-sm backdrop-blur-xl">
      <div className="px-margin-mobile md:px-margin-desktop mx-auto flex h-20 max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-headline-md text-primary font-bold"
        >
          {siteConfig.name}
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {siteConfig.navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-body-md transition-colors",
                isActive(link.href, i)
                  ? "text-primary border-primary border-b-2 pb-1 font-bold"
                  : "text-on-surface/80 hover:text-primary",
              )}
            >
              {link.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="pill-sm"
            className="hidden md:inline-flex"
          >
            Book a Consultation
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="text-on-surface hover:text-primary inline-flex size-10 items-center justify-center rounded-lg transition-colors md:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-surface/95 px-margin-mobile border-t border-white/10 py-6 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {siteConfig.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-on-surface/80 hover:text-primary text-body-md transition-colors"
              >
                {link.title}
              </Link>
            ))}
            <Button variant="brand" size="pill-sm" className="mt-2 w-full">
              Book a Consultation
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
