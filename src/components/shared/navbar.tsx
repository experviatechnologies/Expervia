"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  BrainCircuit,
  CloudCheck,
  ShieldCheck,
  BarChart3,
  LayoutGrid,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type SolutionLink = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

// Detail pages surfaced in the "Solutions" mega-menu. Order mirrors the
// homepage solutions section.
const solutionsMenu: SolutionLink[] = [
  {
    title: "Artificial Intelligence",
    href: "/solutions/ai",
    description: "Generative & predictive AI",
    icon: BrainCircuit,
  },
  {
    title: "Cloud Services",
    href: "/solutions/cloud",
    description: "Migration, hybrid & multi-cloud",
    icon: CloudCheck,
  },
  {
    title: "Cybersecurity",
    href: "/solutions/cybersecurity",
    description: "Zero-Trust & managed SOC",
    icon: ShieldCheck,
  },
  {
    title: "Data & Analytics",
    href: "/solutions/data",
    description: "Modern data platform & BI",
    icon: BarChart3,
  },
  {
    title: "Microsoft Solutions",
    href: "/solutions/microsoft",
    description: "Azure, M365 & Copilot",
    icon: LayoutGrid,
  },
];

// Membership tracks surfaced in the "Community" mega-menu. Add the Microsoft
// track here once its page is built.
const communityMenu: SolutionLink[] = [
  {
    title: "Huawei Professionals",
    href: "/community/huawei",
    description: "Cloud, networking & infrastructure experts",
    icon: Users,
  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const pathname = usePathname();

  // Homepage-section links (/#solutions…) highlight the first item while on the
  // homepage; dedicated route links (/about…) highlight on their own page.
  const isActive = (href: string, index: number) =>
    href.includes("#") ? pathname === "/" && index === 0 : pathname === href;

  return (
    <nav
      onMouseLeave={() => {
        setSolutionsOpen(false);
        setCommunityOpen(false);
      }}
      className="bg-surface/60 fixed top-0 z-50 w-full border-b border-white/10 shadow-sm backdrop-blur-xl"
    >
      <div className="px-margin-mobile md:px-margin-desktop mx-auto flex h-20 max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-headline-md text-primary font-bold"
        >
          {siteConfig.name}
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {siteConfig.navLinks.map((link, i) => {
            const active = isActive(link.href, i);

            // "Solutions" opens the full-width mega-menu below the bar on hover.
            if (link.title === "Solutions") {
              const solutionsActive =
                active || pathname.startsWith("/solutions/");
              return (
                <div
                  key={link.href}
                  onMouseEnter={() => {
                    setCommunityOpen(false);
                    setSolutionsOpen(true);
                  }}
                  onFocus={() => setSolutionsOpen(true)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "text-body-md flex items-center gap-1 transition-colors",
                      solutionsActive || solutionsOpen
                        ? "text-primary font-bold"
                        : "text-on-surface/80 hover:text-primary",
                    )}
                  >
                    {link.title}
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        solutionsOpen && "rotate-180",
                      )}
                    />
                  </Link>
                </div>
              );
            }

            // "Community" opens its own mega-menu of membership tracks.
            if (link.title === "Community") {
              const communityActive =
                active || pathname.startsWith("/community/");
              return (
                <div
                  key={link.href}
                  onMouseEnter={() => {
                    setSolutionsOpen(false);
                    setCommunityOpen(true);
                  }}
                  onFocus={() => setCommunityOpen(true)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "text-body-md flex items-center gap-1 transition-colors",
                      communityActive || communityOpen
                        ? "text-primary font-bold"
                        : "text-on-surface/80 hover:text-primary",
                    )}
                  >
                    {link.title}
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        communityOpen && "rotate-180",
                      )}
                    />
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => {
                  setSolutionsOpen(false);
                  setCommunityOpen(false);
                }}
                className={cn(
                  "text-body-md transition-colors",
                  active
                    ? "text-primary border-primary border-b-2 pb-1 font-bold"
                    : "text-on-surface/80 hover:text-primary",
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="brand"
            size="pill-sm"
            className="hidden md:inline-flex"
          >
            <Link href="/contact">Book a Consultation</Link>
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

      {/* Desktop mega-menu: the navbar itself expands downward on hover. */}
      <div
        className={cn(
          "hidden overflow-hidden transition-all duration-300 ease-out md:block",
          solutionsOpen
            ? "max-h-[32rem] border-t border-white/10 opacity-100"
            : "max-h-0 opacity-0",
        )}
      >
        <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-7xl py-6">
          <p className="text-label-sm text-on-surface-variant mb-4 font-mono tracking-widest uppercase">
            Our Solutions
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            {solutionsMenu.map(({ title, href, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSolutionsOpen(false)}
                className="hover:bg-surface-container-high group/item flex flex-col gap-3 rounded-xl p-4 transition-colors"
              >
                <span className="bg-primary/10 text-primary group-hover/item:bg-primary/20 flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors">
                  <Icon className="size-5" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-on-surface text-body-md font-semibold">
                    {title}
                  </span>
                  <span className="text-on-surface-variant text-sm">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop mega-menu: Community membership tracks. */}
      <div
        className={cn(
          "hidden overflow-hidden transition-all duration-300 ease-out md:block",
          communityOpen
            ? "max-h-[32rem] border-t border-white/10 opacity-100"
            : "max-h-0 opacity-0",
        )}
      >
        <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-7xl py-6">
          <p className="text-label-sm text-on-surface-variant mb-4 font-mono tracking-widest uppercase">
            Membership Tracks
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            {communityMenu.map(({ title, href, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setCommunityOpen(false)}
                className="hover:bg-surface-container-high group/item flex flex-col gap-3 rounded-xl p-4 transition-colors"
              >
                <span className="bg-primary/10 text-primary group-hover/item:bg-primary/20 flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors">
                  <Icon className="size-5" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-on-surface text-body-md font-semibold">
                    {title}
                  </span>
                  <span className="text-on-surface-variant text-sm">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-surface/95 px-margin-mobile border-t border-white/10 py-6 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {siteConfig.navLinks.map((link) => {
              if (link.title === "Solutions") {
                return (
                  <div key={link.href} className="flex flex-col gap-3">
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-on-surface/80 hover:text-primary text-body-md transition-colors"
                    >
                      {link.title}
                    </Link>
                    <div className="border-outline-variant/40 ml-2 flex flex-col gap-3 border-l pl-4">
                      {solutionsMenu.map(({ title, href }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="text-on-surface-variant hover:text-primary text-sm transition-colors"
                        >
                          {title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              if (link.title === "Community") {
                return (
                  <div key={link.href} className="flex flex-col gap-3">
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-on-surface/80 hover:text-primary text-body-md transition-colors"
                    >
                      {link.title}
                    </Link>
                    <div className="border-outline-variant/40 ml-2 flex flex-col gap-3 border-l pl-4">
                      {communityMenu.map(({ title, href }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className="text-on-surface-variant hover:text-primary text-sm transition-colors"
                        >
                          {title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-on-surface/80 hover:text-primary text-body-md transition-colors"
                >
                  {link.title}
                </Link>
              );
            })}
            <Button
              asChild
              variant="brand"
              size="pill-sm"
              className="mt-2 w-full"
            >
              <Link href="/contact" onClick={() => setOpen(false)}>
                Book a Consultation
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
