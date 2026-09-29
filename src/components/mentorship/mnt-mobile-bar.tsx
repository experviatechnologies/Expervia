"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { MntNavItem } from "./mnt-dash-shell";
import { MntSignOutButton } from "./mnt-signout-button";
import { MntNavLinks } from "./mnt-nav-links";

/**
 * Mobile top bar + slide-in drawer for the mentorship dashboards. The desktop
 * sidebar (MntDashShell) is hidden below md, so this is the only navigation on
 * phones: brand + menu button, opening a drawer with the same nav, the
 * role-specific footer card and the account block.
 */
export function MntMobileBar({
  nav,
  footer,
  user,
}: {
  nav: MntNavItem[];
  footer: React.ReactNode;
  user: { initials: string; name: string; role: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Sticky top bar */}
      <div className="border-mnt-line bg-mnt-bg/85 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur">
        <Link href="/mentorship" className="flex items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-7 place-items-center rounded-lg bg-gradient-to-br text-[13px] font-extrabold">
            E
          </span>
          <span className="font-display text-[14px] font-extrabold">
            ETEN Mentorship
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mnt-mobile-drawer"
          className="text-mnt-ink -mr-1 grid size-9 place-items-center rounded-lg"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Overlay + drawer */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60"
        />
      )}
      <aside
        id="mnt-mobile-drawer"
        aria-hidden={!open}
        className={
          "border-mnt-line fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r p-3.5 transition-transform [background:#0d1219] " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-2 pt-1.5 pb-4">
          <Link
            href="/mentorship"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5"
          >
            <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-7 place-items-center rounded-lg bg-gradient-to-br text-[13px] font-extrabold">
              E
            </span>
            <span className="font-display text-[14px] font-extrabold">
              ETEN Mentorship
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-mnt-faint hover:text-mnt-ink grid size-8 place-items-center rounded-lg"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          <MntNavLinks items={nav} onNavigate={() => setOpen(false)} />
        </nav>

        <div className="mt-3 border-t border-white/[0.06] pt-2">
          <MntSignOutButton withLabel />
        </div>

        <div className="flex-1" />

        {footer}

        <div className="mt-3.5 flex items-center gap-2.5 px-1.5 py-2">
          <span className="bg-mnt-brand/14 text-mnt-brand grid size-[30px] shrink-0 place-items-center rounded-full text-[12px] font-bold">
            {user.initials}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-semibold">
              {user.name}
            </span>
            <span className="text-mnt-faint block text-[11px]">
              {user.role}
            </span>
          </span>
        </div>
      </aside>
    </div>
  );
}
