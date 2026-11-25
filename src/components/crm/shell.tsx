"use client";

/**
 * Signed-in shell for the CRM: deep indigo sidebar (the site's Join ETEN
 * palette), top bar with the signed-in staff member, and a mobile drawer.
 * Navigation lists only screens that exist, so there are no dead links; new
 * screens are added to NAV as they are built.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  Building2,
  Contact2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type NavItem = {
  href: string;
  label: string;
  /** Shows a count next to the label (e.g. people waiting for review). */
  badge?: "review";
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};
type NavGroup = { heading?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    items: [{ href: "/crm", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "CRM",
    items: [
      { href: "/crm/contacts", label: "Contacts", icon: Contact2 },
      { href: "/crm/companies", label: "Companies", icon: Building2 },
      {
        href: "/crm/review",
        label: "Review queue",
        icon: ListChecks,
        badge: "review",
      },
    ],
  },
];

// "/crm" (the dashboard) is active only on itself, not on every CRM page.
const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/crm" && pathname.startsWith(`${href}/`));

function Brand() {
  return (
    <Link
      href="/crm"
      className="flex items-center gap-2.5 rounded-xl px-2 py-1"
      aria-label="Expervia CRM home"
    >
      <span className="bg-brand-500 flex size-9 items-center justify-center rounded-xl font-[family-name:var(--font-jakarta)] text-lg font-extrabold text-white">
        E
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-jakarta)] text-[0.95rem] font-bold text-white">
          Expervia CRM
        </span>
        <span className="text-brand-200 mt-1 text-[0.6rem] font-semibold tracking-[0.2em] uppercase">
          Expervia · ETEN
        </span>
      </span>
    </Link>
  );
}

function Sidebar({
  pathname,
  showAdminLink,
  reviewCount,
  onNavigate,
}: {
  pathname: string;
  showAdminLink: boolean;
  reviewCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="bg-brand-950 flex h-full flex-col px-3 py-4">
      <Brand />
      <nav aria-label="CRM" className="mt-6 flex-1 space-y-5 overflow-y-auto">
        {NAV.map((group, i) => (
          <div key={group.heading ?? i}>
            {group.heading && (
              <p className="text-brand-300/80 mb-1 px-3 text-[0.65rem] font-bold tracking-[0.18em] uppercase">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const count = badge === "review" ? reviewCount : 0;
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-visible:outline-brand-300 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                        active
                          ? "bg-white/12 text-white"
                          : "text-brand-100/75 hover:bg-white/8 hover:text-white",
                      )}
                    >
                      <Icon aria-hidden className="size-[18px]" />
                      <span className="flex-1">{label}</span>
                      {count > 0 && (
                        <span className="bg-brand-500 rounded-full px-2 py-0.5 text-xs text-white tabular-nums">
                          {count}
                          <span className="sr-only"> waiting</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {showAdminLink && (
        <Link
          href="/admin/overview"
          className="text-brand-100/80 mt-4 rounded-xl bg-white/6 px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-white/10 hover:text-white"
        >
          Go to the admin console
        </Link>
      )}
    </div>
  );
}

export function CrmShell({
  name,
  email,
  roleLabel,
  showAdminLink,
  reviewCount,
  children,
}: {
  name: string;
  email: string;
  roleLabel: string;
  showAdminLink: boolean;
  reviewCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Links close the drawer themselves (onNavigate); Escape closes it too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || email.charAt(0).toUpperCase();

  const sidebar = (onNavigate?: () => void) => (
    <Sidebar
      pathname={pathname}
      showAdminLink={showAdminLink}
      reviewCount={reviewCount}
      onNavigate={onNavigate}
    />
  );

  return (
    <div
      data-crm-surface
      className="text-ink flex min-h-dvh bg-[#f7f6fb] font-[family-name:var(--font-jakarta)]"
    >
      <a
        href="#crm-main"
        className="focus:text-brand-700 sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        Skip to content
      </a>

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">{sidebar()}</div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="w-64">{sidebar(() => setOpen(false))}</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="bg-brand-950/40 flex-1 backdrop-blur-[1px]"
          >
            <X
              aria-hidden
              className="text-ink m-3 size-6 rounded-lg bg-white p-1"
            />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#ece9f5] bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-ink hover:bg-brand-50 rounded-lg p-2 lg:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-ink text-sm font-semibold">{name || email}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <span
              aria-hidden
              className="bg-brand-700 flex size-9 items-center justify-center rounded-full text-sm font-bold text-white"
            >
              {initials}
            </span>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="hover:bg-brand-50 hover:text-ink inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition-colors disabled:opacity-50"
            >
              <LogOut aria-hidden className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main id="crm-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
