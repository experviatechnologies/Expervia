"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  GraduationCap,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export type NavPod = {
  name: string;
  slug: string;
  role: "member" | "lead" | "co_lead";
};

type NavItem = { href: string; label: string; short: string; Icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/feed", label: "Home", short: "Home", Icon: Home },
  { href: "/pods", label: "Explore Pods", short: "Pods", Icon: LayoutGrid },
  {
    href: "/circles",
    label: "Mentorship",
    short: "Mentor",
    Icon: GraduationCap,
  },
  {
    href: "/messages",
    label: "Messages",
    short: "Messages",
    Icon: MessageSquare,
  },
  {
    href: "/notifications",
    label: "Notifications",
    short: "Alerts",
    Icon: Bell,
  },
  { href: "/profile", label: "My Profile", short: "You", Icon: UserRound },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/pods") return pathname === "/pods";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionTitle(pathname: string | null, pods: NavPod[]): string {
  if (!pathname) return "ETEN";
  if (pathname.startsWith("/pods/")) {
    const slug = pathname.split("/")[2];
    return pods.find((p) => p.slug === slug)?.name ?? "Pod";
  }
  if (pathname === "/pods") return "Explore Pods";
  if (pathname.startsWith("/feed")) return "Home";
  if (pathname.startsWith("/messages")) return "Messages";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/profile/certifications")) return "Certifications";
  if (pathname.startsWith("/profile")) return "My Profile";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Home";
}

export function AppNav({
  memberName,
  email,
  isOps,
  badges = {},
  pods = [],
}: {
  memberName: string | null;
  email: string | null;
  isOps: boolean;
  badges?: Record<string, number>;
  pods?: NavPod[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  async function handleSignOut() {
    setSigningOut(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  const initial = (memberName ?? email ?? "?").trim().charAt(0).toUpperCase();

  const rail = (
    <>
      <Link href="/feed" className="flex flex-col gap-2.5 px-4 pt-5 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/expervia-logo.png"
          alt="Expervia Technologies"
          data-app-logo
          className="h-auto w-[150px]"
        />
        <span className="flex items-center gap-2 pl-0.5">
          <span className="text-eten-ink text-[13px] font-bold">ETEN</span>
          <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2 py-[3px] font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
            Community
          </span>
        </span>
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            const count = badges[href] ?? 0;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-eten-accent-soft text-eten-accent font-bold"
                    : "text-eten-ink-muted hover:bg-eten-hover hover:text-eten-accent font-medium"
                }`}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.9} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="bg-eten-accent grid h-[19px] min-w-[19px] place-items-center rounded-full px-1.5 text-[11px] font-bold text-white tabular-nums">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {pods.length > 0 && (
          <>
            <div className="flex items-center justify-between px-3 pt-5 pb-1.5">
              <span className="text-eten-faint font-mono text-[10.5px] tracking-[.1em] uppercase">
                Your pods
              </span>
              <Link
                href="/pods"
                className="text-eten-faint hover:text-eten-ink text-lg leading-none"
                aria-label="Browse pods"
              >
                +
              </Link>
            </div>
            {pods.map((pod) => {
              const active = pathname === `/pods/${pod.slug}`;
              return (
                <Link
                  key={pod.slug}
                  href={`/pods/${pod.slug}`}
                  className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? "bg-eten-accent-soft text-eten-accent font-semibold"
                      : "text-eten-ink-muted hover:bg-eten-hover hover:text-eten-accent font-medium"
                  }`}
                >
                  <span
                    className={`size-2 shrink-0 rounded-[3px] ${active ? "bg-eten-accent" : "bg-eten-faint"}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{pod.name}</span>
                  {pod.role !== "member" && (
                    <span className="text-eten-verified bg-eten-verified-soft rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[.06em] uppercase">
                      {pod.role === "lead" ? "Lead" : "Co-lead"}
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}

        {isOps && (
          <>
            <div className="px-3 pt-5 pb-1.5">
              <span className="text-eten-faint font-mono text-[10.5px] tracking-[.1em] uppercase">
                Staff
              </span>
            </div>
            <Link
              href="/admin/overview"
              className="text-eten-ink-muted hover:bg-eten-hover hover:text-eten-ink flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <ShieldCheck className="size-[18px] shrink-0" strokeWidth={1.9} />
              Admin console
            </Link>
          </>
        )}
      </div>

      <div className="border-eten-line bg-eten-panel-hi mx-3 mb-3 flex items-center gap-2.5 rounded-[14px] border p-2.5">
        <Link
          href="/profile"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <span className="bg-eten-accent grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white">
            {initial}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="text-eten-ink block truncate text-[13px] font-bold">
              {memberName ?? "Member"}
            </span>
            <span className="text-eten-ink-muted block text-[12px]">
              {isOps ? "Operations" : "Member"}
            </span>
          </span>
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="text-eten-faint hover:bg-eten-hover hover:text-eten-ink grid size-8 place-items-center rounded-lg"
        >
          <Settings className="size-[17px]" strokeWidth={1.8} />
        </Link>
        <ThemeToggle className="text-eten-faint hover:bg-eten-hover hover:text-eten-ink grid size-8 place-items-center rounded-lg" />
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          className="text-eten-faint hover:bg-eten-hover hover:text-eten-ink grid size-8 place-items-center rounded-lg disabled:opacity-50"
        >
          <LogOut className="size-[17px]" strokeWidth={1.8} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="bg-eten-rail border-eten-line-soft fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r md:flex">
        {rail}
      </aside>

      {/* Mobile top bar */}
      <header className="bg-eten-rail border-eten-line sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          className="text-eten-ink-muted hover:text-eten-ink grid size-9 place-items-center rounded-lg"
        >
          <Menu className="size-[22px]" />
        </button>
        <span className="text-eten-ink font-display text-[17px] font-semibold">
          {sectionTitle(pathname, pods)}
        </span>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawer(false)}
          />
          <aside
            className="bg-eten-rail border-eten-line-soft absolute inset-y-0 left-0 flex w-72 flex-col border-r shadow-2xl"
            onClick={(e) => {
              // Close when any link inside the drawer is tapped.
              if ((e.target as HTMLElement).closest("a")) setDrawer(false);
            }}
          >
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
              className="text-eten-faint hover:text-eten-ink absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-lg"
            >
              <X className="size-5" />
            </button>
            {rail}
          </aside>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="bg-eten-rail/95 border-eten-line fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map(({ href, short, Icon }) => {
          const active = isActive(pathname, href);
          const count = badges[href] ?? 0;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${
                active ? "text-eten-accent" : "text-eten-faint"
              }`}
            >
              <span className="relative">
                <Icon className="size-[22px]" strokeWidth={1.9} />
                {count > 0 && (
                  <span className="border-eten-rail bg-eten-accent absolute -top-1 -right-2 grid h-[15px] min-w-[15px] place-items-center rounded-full border-[1.5px] px-1 text-[9px] font-bold text-white tabular-nums">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              {short}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
