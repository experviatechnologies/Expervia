"use client";

/**
 * Signed-in shell for the presales tracker: demo banner, deep-purple sidebar
 * with role-based navigation, top bar (engineer search, notifications, user)
 * and a mobile drawer. Pages render inside <main>. Until the demo store has
 * hydrated it shows a quiet loader; without a persona it sends the visitor to
 * the demo sign-in.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarClock,
  LayoutGrid,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  Settings,
  UserCheck,
  Users,
  Video,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTracker } from "@/lib/tracker/store";
import { has, isSales, primaryRole } from "@/lib/tracker/selectors";
import { ROLE_LABEL } from "@/lib/tracker/labels";
import type { Member } from "@/lib/tracker/types";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, Btn } from "./ui";

export const BASE = "/tracker";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const ALL = {
  dashboard: {
    href: `${BASE}/dashboard`,
    label: "Dashboard",
    icon: LayoutGrid,
  },
  availability: {
    href: `${BASE}/availability`,
    label: "Availability",
    icon: CalendarClock,
  },
  directory: {
    href: `${BASE}/directory`,
    label: "ETEN Directory",
    icon: Users,
  },
  requests: {
    href: `${BASE}/requests`,
    label: "Presales Requests",
    icon: Briefcase,
  },
  nominations: {
    href: `${BASE}/nominations`,
    label: "Nominations",
    icon: UserCheck,
  },
  meetings: { href: `${BASE}/meetings`, label: "Meetings", icon: Video },
  notifications: {
    href: `${BASE}/notifications`,
    label: "Notifications",
    icon: Bell,
  },
  reports: { href: `${BASE}/reports`, label: "Reports", icon: BarChart3 },
  settings: { href: `${BASE}/settings`, label: "Settings", icon: Settings },
};
type Key = keyof typeof ALL;

/** Navigation per role (PRD section 5). Pod Leaders are also members. */
export function navKeys(me: Member): Key[] {
  if (isSales(me) && !has(me, "admin"))
    return [
      "dashboard",
      "availability",
      "directory",
      "requests",
      "nominations",
      "meetings",
      "notifications",
      "reports",
      "settings",
    ];
  if (has(me, "admin"))
    return [
      "dashboard",
      "directory",
      "requests",
      "notifications",
      "reports",
      "settings",
    ];
  if (has(me, "management"))
    return ["dashboard", "requests", "notifications", "reports", "settings"];
  const keys: Key[] = ["dashboard", "availability", "directory"];
  if (has(me, "pod_leader")) keys.push("nominations");
  keys.push("meetings", "notifications", "settings");
  return keys;
}

/** Whether the current path is a section this persona may open. */
function allowed(me: Member, pathname: string) {
  const section = pathname.slice(BASE.length + 1).split("/")[0] as Key;
  if (!section) return true;
  // Request detail pages do their own per-request access check.
  if (
    section === "requests" &&
    pathname.split("/").length > 3 &&
    !pathname.endsWith("/new")
  )
    return true;
  return navKeys(me).includes(section);
}

export function TrackerShell({ children }: { children: React.ReactNode }) {
  const t = useTracker();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (t.ready && !t.me) router.replace(`${BASE}/login`);
  }, [t.ready, t.me, router]);

  // Close the mobile drawer when navigating.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  if (!t.ready || !t.me) {
    return (
      <div className="bg-eten-canvas text-eten-faint grid min-h-screen place-items-center text-[14px]">
        Loading the tracker…
      </div>
    );
  }

  const me = t.me;
  const unread = t.data.notifications.filter(
    (n) => n.to === me.id && !n.read,
  ).length;
  const nav: NavItem[] = navKeys(me).map((k) => ({
    ...ALL[k],
    badge: k === "notifications" ? unread : undefined,
  }));

  const signOut = () => {
    t.signOut();
    router.push(`${BASE}/login`);
  };

  const rail = (
    <div className="flex h-full flex-col">
      <Link
        href={`${BASE}/dashboard`}
        className="flex flex-col gap-2.5 px-3 pt-4 pb-5"
      >
        <span className="inline-flex w-fit rounded-xl bg-white px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/expervia-logo.png"
            alt="Expervia Technologies"
            className="h-auto w-[132px]"
          />
        </span>
        <span className="text-trk-rail-muted text-[11px] font-bold tracking-[0.14em] uppercase">
          ETEN Availability Tracker
        </span>
      </Link>
      <nav aria-label="Tracker" className="flex flex-col gap-0.5 px-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition-colors",
                active
                  ? "bg-trk-rail-active text-trk-rail-ink"
                  : "text-trk-rail-muted hover:text-trk-rail-ink hover:bg-trk-rail-active/60",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="text-trk-rail grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-[11px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      <div className="bg-trk-rail-active m-3 rounded-2xl p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={me.name} size={34} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-trk-rail-ink truncate text-[14px] font-bold">
              {me.name}
            </p>
            <p className="text-trk-rail-muted truncate text-[12px]">
              {me.roles
                .filter((r) => r !== "member" || me.roles.length === 1)
                .map((r) => ROLE_LABEL[r])
                .join(" · ") || ROLE_LABEL[primaryRole(me)]}
            </p>
          </div>
          <ThemeToggle className="text-trk-rail-muted hover:text-trk-rail-ink grid size-8 shrink-0 place-items-center rounded-lg" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={`${BASE}/login`}
            className="text-trk-rail-ink flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2 py-2 text-[12.5px] font-semibold hover:bg-white/15"
          >
            <ArrowLeftRight className="size-3.5" /> Switch
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="text-trk-rail-ink flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2 py-2 text-[12.5px] font-semibold hover:bg-white/15"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-eten-canvas text-eten-ink min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <div className="lg:grid lg:grid-cols-[256px_1fr]">
        <aside className="bg-trk-rail sticky top-0 hidden h-screen lg:block">
          {rail}
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside className="bg-trk-rail absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="text-trk-rail-ink absolute top-3 right-3 rounded-lg p-1.5"
              >
                <X className="size-5" />
              </button>
              {rail}
            </aside>
          </div>
        )}

        <div className="min-w-0">
          <DemoBanner onReset={t.reset} />
          <header className="border-eten-line bg-eten-panel/95 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              className="text-eten-ink-muted -ml-1 rounded-lg p-1.5 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            {navKeys(me).includes("directory") ? (
              <TopSearch />
            ) : (
              <div className="flex-1" />
            )}
            <Link
              href={`${BASE}/notifications`}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              className="text-eten-ink-muted hover:text-eten-ink relative rounded-lg p-2"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="bg-trk-danger absolute top-1.5 right-1.5 size-2 rounded-full" />
              )}
            </Link>
            <Link
              href={`${BASE}/settings`}
              aria-label="Your profile and settings"
              className="flex items-center gap-2 rounded-lg p-1"
            >
              <Avatar name={me.name} size={32} />
              <span className="hidden text-[14px] font-semibold sm:block">
                {me.name.split(" ")[0]}
              </span>
            </Link>
          </header>
          {/* The root layout already provides the <main> landmark. */}
          <div
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1320px] px-4 py-6 outline-none sm:px-6 lg:py-8"
          >
            {allowed(me, pathname) ? children : <NoAccess />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="relative max-w-[460px] flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(
          `${BASE}/directory${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
        );
      }}
    >
      <Search className="text-eten-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <label htmlFor="trk-top-search" className="sr-only">
        Search the ETEN directory
      </label>
      <input
        id="trk-top-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search engineers by name or skill"
        className="border-eten-line bg-eten-canvas text-eten-ink placeholder:text-eten-faint focus:border-eten-accent h-10 w-full rounded-xl border pr-3 pl-9 text-[14px] focus:outline-none"
      />
    </form>
  );
}

export function DemoBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-trk-banner text-trk-banner-ink px-4 py-2 text-center text-[13px]">
      <strong>Demo data.</strong> All people, clients and figures are fictional
      and stored only in this browser. Calendars and email are simulated.{" "}
      <button
        type="button"
        onClick={() => {
          if (
            confirm(
              "Reset the demo? All changes made in this browser will be lost.",
            )
          )
            onReset();
        }}
        className="ml-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
      >
        <RotateCcw className="size-3.5" /> Reset demo
      </button>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="border-eten-line bg-eten-panel mx-auto max-w-[520px] rounded-2xl border p-8 text-center">
      <p className="text-[17px] font-bold">
        You do not have access to this page
      </p>
      <p className="text-eten-ink-muted mt-1 text-[14px]">
        This section is not part of your role. Switch to another demo account to
        see it.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Btn href={`${BASE}/dashboard`} variant="primary">
          Go to dashboard
        </Btn>
        <Btn href={`${BASE}/login`}>Switch account</Btn>
      </div>
    </div>
  );
}
