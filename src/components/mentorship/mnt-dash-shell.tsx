import Link from "next/link";
import { MntMobileBar } from "./mnt-mobile-bar";

export type MntNavItem = { label: string; href?: string; active?: boolean };

/**
 * Sidebar + main shell for the mentorship dashboards (mentee and mentor share
 * it). The rail is a deeper ground than the content, with the product logo, a
 * nav list, a role-specific footer slot (the Prospect "validate" card or the
 * Verified-Mentor badge) and the account block. Dumb and presentational:
 * callers pass the nav, the footer node and the user.
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
    <div className="grid min-h-screen md:grid-cols-[244px_1fr]">
      <aside className="border-mnt-line hidden flex-col border-r p-3.5 [background:#0d1219] md:flex">
        <Link
          href="/mentorship"
          className="flex items-center gap-2.5 px-2 pt-1.5 pb-4"
        >
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-7 place-items-center rounded-lg bg-gradient-to-br text-[13px] font-extrabold">
            E
          </span>
          <span className="font-display text-[14px] font-extrabold">
            ETEN Mentorship
          </span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              aria-current={item.active ? "page" : undefined}
              className={
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors " +
                (item.active
                  ? "bg-mnt-brand/10 text-[#d8ccff]"
                  : "text-mnt-ink-muted hover:text-mnt-ink hover:bg-white/[0.03]")
              }
            >
              <span
                aria-hidden="true"
                className={
                  "size-4 shrink-0 rounded-[5px] " +
                  (item.active ? "bg-mnt-brand" : "bg-mnt-faint/70")
                }
              />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {footer}

        <div className="mt-3.5 flex items-center gap-2.5 px-1.5 py-2">
          <span className="bg-mnt-brand/14 text-mnt-brand grid size-[30px] place-items-center rounded-full text-[12px] font-bold">
            {user.initials}
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold">{user.name}</span>
            <span className="text-mnt-faint block text-[11px]">
              {user.role}
            </span>
          </span>
        </div>
      </aside>

      <main className="bg-mnt-bg min-h-screen">
        <MntMobileBar nav={nav} footer={footer} user={user} />
        {children}
      </main>
    </div>
  );
}
