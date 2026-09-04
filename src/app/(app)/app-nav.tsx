"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Newspaper;
};

const NAV: NavItem[] = [
  { href: "/feed", label: "Feed", Icon: Newspaper },
  { href: "/pods", label: "Explore Pods", Icon: LayoutGrid },
  { href: "/messages", label: "Messages", Icon: MessageSquare },
  { href: "/notifications", label: "Notifications", Icon: Bell },
  { href: "/profile", label: "My Profile", Icon: UserRound },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({
  memberName,
  email,
  isOps,
}: {
  memberName: string | null;
  email: string | null;
  isOps: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  const initial = (memberName ?? email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="border-outline-variant bg-surface fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="text-headline-md font-display text-on-surface font-extrabold tracking-tight">
            ETEN
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            );
          })}

          {isOps && (
            <Link
              href="/admin/applications"
              className="text-on-surface-variant hover:text-on-surface mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
            >
              <ShieldCheck className="size-5 shrink-0" />
              Admin console
            </Link>
          )}
        </nav>

        {/* Member + sign out */}
        <div className="border-outline-variant mt-4 border-t pt-4">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-on-surface truncate text-sm font-medium">
                {memberName ?? "Member"}
              </p>
              {email && (
                <p className="text-on-surface-variant truncate text-xs">
                  {email}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-on-surface-variant hover:text-on-surface flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            <LogOut className="size-5 shrink-0" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="border-outline-variant bg-surface/80 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-body-lg font-display text-on-surface font-extrabold tracking-tight">
            ETEN
          </span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="border-outline-variant bg-surface/90 fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t backdrop-blur md:hidden">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <Icon className="size-5" />
              <span className="max-w-full truncate px-0.5">
                {label.replace("Explore ", "")}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
