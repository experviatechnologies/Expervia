import Link from "next/link";
import { MntMobileBar } from "./mnt-mobile-bar";
import { MntSignOutButton } from "./mnt-signout-button";
import { MntNavLinks } from "./mnt-nav-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export type MntNavItem = { label: string; href?: string; badge?: number };

/**
 * Persistent sidebar + main shell for the mentorship dashboards. Rendered once
 * by the (dash) route-group layout so the sidebar stays fixed as the main area
 * swaps between pages. The rail is a deeper ground than the content, with the
 * product logo, the nav list, a role-specific footer slot (the Prospect
 * "validate" card or the Verified-Mentor badge) and the account block. Active
 * nav state is derived from the URL by MntNavLinks.
 */
export function MntDashShell({
  nav,
  footer,
  user,
  children,
}: {
  nav: MntNavItem[];
  footer: React.ReactNode;
  user: { initials: string; name: string; role: string };
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen md:grid-cols-[244px_1fr]"
      data-app-surface
    >
      <aside className="border-mnt-line bg-mnt-panel hidden flex-col border-r p-3.5 md:flex">
        <Link
          href="/mentorship"
          className="flex flex-col gap-2.5 px-2 pt-1.5 pb-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/expervia-logo.png"
            alt="Expervia Technologies"
            data-app-logo
            className="h-auto w-[150px]"
          />
          <span className="flex items-center gap-2 pl-0.5">
            <span className="text-mnt-ink text-[13px] font-bold">ETEN</span>
            <span className="text-mnt-brand rounded-full px-2 py-[3px] font-mono text-[10px] font-semibold tracking-[0.1em] uppercase [background:rgba(74,22,196,0.1)]">
              Mentorship
            </span>
          </span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          <MntNavLinks items={nav} />
        </nav>

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
          <ThemeToggle className="text-mnt-faint hover:text-mnt-ink grid size-8 shrink-0 place-items-center rounded-lg transition-colors" />
          <MntSignOutButton />
        </div>
      </aside>

      <main className="bg-mnt-bg min-h-screen">
        <MntMobileBar nav={nav} footer={footer} user={user} />
        {children}
      </main>
    </div>
  );
}
