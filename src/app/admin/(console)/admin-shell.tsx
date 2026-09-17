"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Boxes,
  FileText,
  CalendarCheck,
  BadgeCheck,
  IdCard,
  ShieldAlert,
  Tags,
  UserPlus,
  ScrollText,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type NavItem = {
  label: string;
  href?: string;
  Icon: LucideIcon;
  soon?: boolean;
};
type NavGroup = { heading: string; items: NavItem[] };

// Grouped navigation for the console (approved in the Step 1.1 mockup). Items
// without an href are future phases, shown disabled with a "Soon" tag so the
// full shape of the admin is visible: Pods = Phase 4, Identity & Address =
// Phase 6.
const GROUPS: NavGroup[] = [
  {
    heading: "Dashboard",
    items: [
      { label: "Overview", href: "/admin/overview", Icon: LayoutDashboard },
    ],
  },
  {
    heading: "Community",
    items: [
      { label: "Members", href: "/admin/members", Icon: Users },
      { label: "Pods", href: "/admin/pods", Icon: Boxes },
      { label: "Applications", href: "/admin/applications", Icon: FileText },
      {
        label: "Event Registrations",
        href: "/admin/events",
        Icon: CalendarCheck,
      },
    ],
  },
  {
    heading: "Trust & Verification",
    items: [
      {
        label: "Certifications",
        href: "/admin/certifications",
        Icon: BadgeCheck,
      },
      {
        label: "Identity & Address",
        href: "/admin/verifications",
        Icon: IdCard,
      },
      { label: "Reports", href: "/admin/reports", Icon: ShieldAlert },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Skills Taxonomy", href: "/admin/taxonomy", Icon: Tags },
      { label: "Migration", href: "/admin/migration", Icon: UserPlus },
      { label: "Audit Log", href: "/admin/audit", Icon: ScrollText },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({
  managerEmail,
  children,
}: {
  managerEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = (managerEmail || "?").trim().charAt(0).toUpperCase();
  const sectionTitle =
    GROUPS.flatMap((g) => g.items).find(
      (i) => i.href && isActive(pathname, i.href),
    )?.label ?? "Admin";

  async function signOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const rail = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <span className="from-eten-accent grid size-8 place-items-center rounded-[9px] bg-gradient-to-br to-[#3257b8] text-sm font-extrabold text-white">
          E
        </span>
        <div className="leading-tight">
          <div className="text-eten-ink text-[15px] font-bold">ETEN</div>
          <div className="text-eten-faint font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
            Admin Console
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((group) => (
          <div key={group.heading} className="mb-1">
            <h6 className="text-eten-faint mx-2 mt-4 mb-1.5 font-mono text-[10.5px] font-bold tracking-[0.16em] uppercase">
              {group.heading}
            </h6>
            {group.items.map((item) => {
              const active = item.href ? isActive(pathname, item.href) : false;
              const inner = (
                <>
                  <item.Icon
                    className={
                      "size-[17px] shrink-0 " +
                      (active ? "text-eten-accent" : "text-eten-faint")
                    }
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="border-eten-line text-eten-faint rounded-[5px] border px-1.5 py-px font-mono text-[9.5px] font-bold tracking-[0.08em]">
                      SOON
                    </span>
                  )}
                </>
              );
              const base =
                "mb-0.5 flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-semibold";
              if (!item.href) {
                return (
                  <div
                    key={item.label}
                    className={base + " text-eten-faint/70 cursor-default"}
                    aria-disabled="true"
                  >
                    {inner}
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={
                    base +
                    " " +
                    (active
                      ? "bg-eten-accent-soft text-[#cddcfb]"
                      : "text-eten-ink-muted hover:bg-eten-hover hover:text-eten-ink")
                  }
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: identity + sign out */}
      <div className="border-eten-line-soft flex items-center gap-2.5 border-t px-4 py-3.5">
        <span className="bg-eten-accent-soft text-eten-accent grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-eten-ink truncate text-[13px] font-semibold">
            {managerEmail || "Operations"}
          </div>
          <div className="text-eten-faint text-[11px]">Operations</div>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          aria-label="Sign out"
          title="Sign out"
          className="text-eten-faint hover:text-eten-ink hover:bg-eten-hover grid size-8 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-eten-canvas text-eten-ink min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-eten-rail border-eten-line-soft fixed inset-y-0 left-0 z-30 hidden w-64 border-r md:block">
        {rail}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
      <aside
        className={
          "bg-eten-rail border-eten-line-soft fixed inset-y-0 left-0 z-50 w-64 border-r transition-transform md:hidden " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="text-eten-faint hover:text-eten-ink absolute top-4 right-3 z-10"
        >
          <X className="size-5" />
        </button>
        {rail}
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        {/* Mobile top bar */}
        <div className="border-eten-line-soft bg-eten-rail/80 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="text-eten-ink"
          >
            <Menu className="size-6" />
          </button>
          <span className="text-eten-ink font-semibold">{sectionTitle}</span>
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
