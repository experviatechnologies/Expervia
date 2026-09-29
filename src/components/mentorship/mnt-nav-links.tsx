"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MntNavItem } from "./mnt-dash-shell";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * The dashboard nav list, rendered in both the desktop rail and the mobile
 * drawer. Active state is derived from the current path (client-side) so the
 * shared dashboard layout doesn't need to pass per-page active flags.
 */
export function MntNavLinks({
  items,
  onNavigate,
}: {
  items: MntNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base =
    "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold transition-colors";

  return (
    <>
      {items.map((item) => {
        const active = item.href ? isActive(pathname, item.href) : false;
        const inner = (
          <>
            <span
              aria-hidden="true"
              className={
                "size-4 shrink-0 rounded-[5px] " +
                (active ? "bg-mnt-brand" : "bg-mnt-faint/70")
              }
            />
            {item.label}
          </>
        );
        if (!item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              className={base + " text-mnt-faint/70 cursor-default"}
            >
              {inner}
            </span>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={
              base +
              " " +
              (active
                ? "bg-mnt-brand/10 text-[#d8ccff]"
                : "text-mnt-ink-muted hover:text-mnt-ink hover:bg-white/[0.03]")
            }
          >
            {inner}
          </Link>
        );
      })}
    </>
  );
}
