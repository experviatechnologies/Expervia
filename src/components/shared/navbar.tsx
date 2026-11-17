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
  Cloud,
  Code2,
  Workflow,
  Shield,
  GraduationCap,
  Sparkles,
  Network,
  type LucideIcon,
} from "lucide-react";
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

// Membership tracks surfaced in the "Community" mega-menu.
// Link to the mentorship subdomain when configured, else the path.
const MENTORSHIP_HREF = process.env.NEXT_PUBLIC_MENTORSHIP_HOST
  ? `https://${process.env.NEXT_PUBLIC_MENTORSHIP_HOST}`
  : "/mentorship";

const communityMenu: SolutionLink[] = [
  {
    title: "ETEN Expert Network",
    href: "/join-eten",
    description: "What ETEN is and why professionals join",
    icon: Network,
  },
  {
    title: "Mentorship",
    href: MENTORSHIP_HREF,
    description: "Grow with verified mentors & Circles",
    icon: GraduationCap,
  },
  {
    title: "Women in Tech",
    href: "/women-in-tech",
    description: "Connect, grow and lead in technology",
    icon: Sparkles,
  },
  {
    title: "Huawei Professionals",
    href: "/community/huawei",
    description: "Cloud, networking & infrastructure experts",
    icon: Users,
  },
  {
    title: "Microsoft Professionals",
    href: "/community/microsoft",
    description: "Azure, Security, Data & AI experts",
    icon: LayoutGrid,
  },
  {
    title: "AWS Professionals",
    href: "/community/aws",
    description: "Cloud architecture & engineering on AWS",
    icon: CloudCheck,
  },
  {
    title: "Google Cloud Professionals",
    href: "/community/gcp",
    description: "Architecture, data & DevOps on Google Cloud",
    icon: Cloud,
  },
  {
    title: "Software Engineering",
    href: "/community/software-engineering",
    description: "Development, system design & craft",
    icon: Code2,
  },
  {
    title: "DevOps",
    href: "/community/devops",
    description: "CI/CD, automation & reliability",
    icon: Workflow,
  },
  {
    title: "ISC2 Cybersecurity",
    href: "/community/isc2-cybersecurity",
    description: "CISSP, CCSP & security specialists",
    icon: ShieldCheck,
  },
  {
    title: "ISACA Cybersecurity",
    href: "/community/isaca-cybersecurity",
    description: "Audit, risk & governance (CISA, CISM)",
    icon: Shield,
  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<"solutions" | "community" | null>(null);
  const pathname = usePathname();

  // Homepage-section links (/#solutions…) highlight the first item while on the
  // homepage; dedicated route links (/about…) highlight on their own page.
  const isActive = (href: string, index: number) =>
    href.includes("#") ? pathname === "/" && index === 0 : pathname === href;

  const sectionActive = {
    solutions: pathname.startsWith("/solutions/"),
    community:
      pathname.startsWith("/community/") ||
      pathname === "/join-eten" ||
      pathname === "/women-in-tech",
  };

  const linkClass = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.95rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
      active ? "text-brand-300" : "text-white/75 hover:text-white",
    );

  const megaItems =
    menu === "solutions"
      ? solutionsMenu
      : menu === "community"
        ? communityMenu
        : [];

  return (
    <header
      onMouseLeave={() => setMenu(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setMenu(null);
      }}
      className="bg-night/95 fixed top-0 z-50 w-full border-b border-white/10 text-white backdrop-blur-md"
    >
      <a
        href="#main"
        className="bg-brand-600 sr-only rounded-md px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-10"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          aria-label="Expervia Technologies home"
          className="focus-visible:ring-brand-300 shrink-0 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-bold tracking-tight text-white">
              Expervia Technologies
            </span>
            <span className="text-brand-200 mt-1 text-[0.62rem] font-semibold tracking-[0.22em] uppercase">
              Expert Network · ETEN
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {siteConfig.navLinks.map((link, i) => {
              const key =
                link.title === "Solutions"
                  ? "solutions"
                  : link.title === "Community"
                    ? "community"
                    : null;
              if (key) {
                const expanded = menu === key;
                return (
                  <li key={link.href} onMouseEnter={() => setMenu(key)}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls="site-mega-menu"
                      onClick={() => setMenu(expanded ? null : key)}
                      className={linkClass(
                        expanded ||
                          sectionActive[key] ||
                          isActive(link.href, i),
                      )}
                    >
                      {link.title}
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-4 transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </button>
                  </li>
                );
              }
              return (
                <li key={link.href} onMouseEnter={() => setMenu(null)}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href, i) ? "page" : undefined}
                    className={linkClass(isActive(link.href, i))}
                  >
                    {link.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/join"
            className="hidden min-h-11 items-center rounded-full border border-white/25 px-5 text-sm font-semibold whitespace-nowrap text-white transition hover:border-white/60 hover:bg-white/5 sm:inline-flex"
          >
            Join ETEN
          </Link>
          <Link
            href="/contact"
            className="bg-brand-400 hover:bg-brand-500 hidden min-h-11 items-center rounded-full px-5 text-sm font-semibold whitespace-nowrap text-white shadow-[0_10px_30px_-12px_rgba(138,92,246,0.9)] transition md:inline-flex"
          >
            Book a Consultation
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => setOpen((v) => !v)}
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

      {/* Desktop mega-menu panel (Solutions / Community). */}
      <div
        id="site-mega-menu"
        hidden={!menu}
        className="hidden border-t border-white/10 xl:block"
      >
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10">
          <p className="text-brand-200 mb-4 text-xs font-bold tracking-[0.2em] uppercase">
            {menu === "solutions" ? "Our Solutions" : "ETEN Communities"}
          </p>
          <ul className="grid grid-cols-5 gap-2">
            {megaItems.map(({ title, href, description, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenu(null)}
                  className="group/item flex h-full flex-col gap-3 rounded-2xl p-4 transition-colors hover:bg-white/5"
                >
                  <span className="text-brand-200 group-hover/item:bg-brand-600/40 flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-colors">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold text-white">{title}</span>
                    <span className="text-sm text-white/55">{description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="site-mobile-menu"
          className="bg-night max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-white/10 px-4 pt-2 pb-6 sm:px-6 xl:hidden"
        >
          <nav aria-label="Main mobile">
            <ul className="flex flex-col">
              {siteConfig.navLinks.map((link) => {
                const sub =
                  link.title === "Solutions"
                    ? solutionsMenu
                    : link.title === "Community"
                      ? communityMenu
                      : null;
                return (
                  <li key={link.href} className="border-b border-white/5">
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-3.5 text-base font-medium text-white"
                    >
                      {link.title}
                    </Link>
                    {sub && (
                      <ul className="pb-3 pl-2">
                        {sub.map(({ title, href }) => (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={() => setOpen(false)}
                              className="block rounded-lg px-3 py-2.5 text-white/75 hover:bg-white/5 hover:text-white"
                            >
                              {title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 font-semibold text-white hover:bg-white/5"
            >
              Join ETEN
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="bg-brand-400 hover:bg-brand-500 inline-flex min-h-12 items-center justify-center rounded-full font-semibold text-white"
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
