"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  GraduationCap,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export type NotifItem = {
  id: string;
  who: string;
  what: string;
  href: string;
  iconKey:
    | "comment"
    | "reaction"
    | "message"
    | "mention"
    | "mentorship"
    | "pod";
  tag: string;
  tone: "accent" | "verified" | "blue" | "amber";
  when: string;
  isRead: boolean;
  group: "recent" | "earlier";
};

const ICONS: Record<NotifItem["iconKey"], LucideIcon> = {
  comment: MessageSquare,
  reaction: ThumbsUp,
  message: MessageSquare,
  mention: Sparkles,
  mentorship: GraduationCap,
  pod: Bell,
};

const TONE: Record<NotifItem["tone"], string> = {
  accent: "bg-eten-accent-soft text-eten-accent",
  verified: "bg-eten-verified-soft text-eten-verified",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

type Filter = "all" | "unread" | "mentorship" | "posts" | "messages";

const MATCH: Record<Filter, (n: NotifItem) => boolean> = {
  all: () => true,
  unread: (n) => !n.isRead,
  mentorship: (n) => n.iconKey === "mentorship",
  posts: (n) =>
    n.iconKey === "comment" ||
    n.iconKey === "reaction" ||
    n.iconKey === "mention" ||
    n.iconKey === "pod",
  messages: (n) => n.iconKey === "message",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "mentorship", label: "Mentorship" },
  { key: "posts", label: "Posts" },
  { key: "messages", label: "Messages" },
];

export function NotificationsList({ initial }: { initial: NotifItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [, startTransition] = useTransition();

  const unreadCount = items.filter((n) => !n.isRead).length;

  const shown = useMemo(() => items.filter(MATCH[filter]), [items, filter]);
  const groups = (["recent", "earlier"] as const)
    .map((g) => ({
      key: g,
      label: g === "recent" ? "This week" : "Earlier",
      items: shown.filter((n) => n.group === g),
    }))
    .filter((g) => g.items.length > 0);

  function open(n: NotifItem) {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      startTransition(() => {
        void markNotificationRead(n.id);
      });
    }
    router.push(n.href);
  }

  function markAll() {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    startTransition(() => {
      void markAllNotificationsRead();
    });
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Notifications
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px]">
            {unreadCount > 0
              ? `${unreadCount} unread of ${items.length} notification${items.length === 1 ? "" : "s"}`
              : `All ${items.length} notification${items.length === 1 ? "" : "s"} read`}
          </p>
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={unreadCount === 0}
          className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-50"
        >
          <CheckCheck className="size-4" strokeWidth={2} />
          Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div
        role="tablist"
        aria-label="Filter notifications"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => {
          const on = filter === f.key;
          const count = items.filter(MATCH[f.key]).length;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.key)}
              className={
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors " +
                (on
                  ? "border-eten-accent bg-eten-accent text-white"
                  : "border-eten-line text-eten-ink-muted hover:text-eten-ink")
              }
            >
              {f.label}
              <span
                className={
                  "rounded-full px-1.5 py-px text-[11px] font-bold " +
                  (on ? "bg-white/20 text-white" : "bg-eten-hover")
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="border-eten-line flex flex-col items-center gap-2.5 rounded-[18px] border border-dashed px-6 py-10 text-center">
          <span className="bg-eten-accent-soft text-eten-accent grid size-13 place-items-center rounded-2xl">
            <Bell className="size-6" />
          </span>
          <div className="text-eten-ink text-[16px] font-bold">
            You&apos;re all caught up
          </div>
          <div className="text-eten-ink-muted text-[13px]">
            Nothing here for this filter.
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="flex flex-col gap-2.5">
            <h2 className="text-eten-faint font-mono text-[11px] font-bold tracking-[0.08em] uppercase">
              {g.label}
            </h2>
            {g.items.map((n) => {
              const Icon = ICONS[n.iconKey];
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => open(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open(n);
                    }
                  }}
                  className={
                    "flex cursor-pointer flex-wrap items-center gap-3.5 rounded-[16px] border p-4 transition-shadow hover:shadow-[0_6px_18px_rgba(17,2,99,0.06)] " +
                    (n.isRead
                      ? "bg-eten-panel border-eten-line"
                      : "border-eten-accent/40 bg-eten-accent-soft")
                  }
                >
                  <span
                    className={
                      "grid size-11 shrink-0 place-items-center rounded-xl " +
                      TONE[n.tone]
                    }
                  >
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                    <div className="text-eten-ink-muted text-[15px] leading-snug">
                      {n.who && (
                        <strong className="text-eten-ink font-bold">
                          {n.who}
                        </strong>
                      )}{" "}
                      {n.what}
                    </div>
                    <div className="text-eten-faint flex flex-wrap items-center gap-2 text-[12px]">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 font-bold " + TONE[n.tone]
                        }
                      >
                        {n.tag}
                      </span>
                      <span>{n.when}</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <span
                      aria-label="Unread"
                      className="bg-eten-accent ring-eten-accent/20 size-2.5 shrink-0 rounded-full ring-4"
                    />
                  )}
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
