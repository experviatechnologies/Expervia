"use client";

/**
 * In-app notifications (PRD section 10): requests, deadlines and changes that
 * need the signed-in persona's attention, with email delivery status per item.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/tracker/store";
import { fmtAgo } from "@/lib/tracker/time";
import {
  Btn,
  Card,
  EmptyState,
  PageHeader,
  Pill,
  Tabs,
  useToast,
} from "@/components/tracker/ui";
import { DueBadge, requestHref } from "@/components/tracker/bits";

export function NotificationsView() {
  const t = useSession();
  const { data, me } = t;
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const mine = data.notifications
    .filter((n) => n.to === me.id)
    .sort((a, b) => b.at.localeCompare(a.at));
  const unread = mine.filter((n) => !n.read);
  const shown = tab === "unread" ? unread : mine;
  const ref = (id?: string) => data.requests.find((r) => r.id === id)?.ref;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Requests, deadlines and changes that need your attention. Email delivery is shown on each item."
        actions={
          unread.length > 0 && (
            <Btn
              onClick={() => {
                t.markAllRead();
                toast("All notifications marked as read.");
              }}
            >
              Mark all as read
            </Btn>
          )
        }
      />
      <Tabs
        label="Notification filter"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "unread", label: "Unread", count: unread.length },
          { id: "all", label: "All", count: mine.length },
        ]}
      />
      <Card bodyClassName="">
        {shown.length === 0 ? (
          <EmptyState
            title={
              tab === "unread"
                ? "You are all caught up"
                : "No notifications yet"
            }
          >
            New requests, invitations and reminders appear here.
          </EmptyState>
        ) : (
          <ul>
            {shown.map((n) => {
              const href =
                n.href ?? (n.requestId ? requestHref(n.requestId) : undefined);
              return (
                <li
                  key={n.id}
                  className={cn(
                    "border-eten-line-soft flex flex-wrap gap-3 border-b px-5 py-4 last:border-0",
                    !n.read && "bg-eten-accent-soft/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-2 size-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-eten-accent",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ref(n.requestId) && (
                        <span className="text-eten-accent text-[12.5px] font-bold">
                          {ref(n.requestId)}
                        </span>
                      )}
                      {n.critical && <Pill tone="danger">Critical</Pill>}
                      {n.dueAt && !n.read && <DueBadge due={n.dueAt} />}
                      <span className="text-eten-faint text-[12.5px]">
                        {fmtAgo(n.at)}
                      </span>
                    </div>
                    <p className="mt-1 font-bold">{n.title}</p>
                    <p className="text-eten-ink-muted text-[13.5px]">
                      {n.body}
                    </p>
                    {n.action && (
                      <p className="mt-0.5 text-[13px]">Action: {n.action}</p>
                    )}
                    <p className="text-eten-faint mt-1 text-[12px]">
                      In-app only in the demo (email delivery is simulated)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    {href && (
                      <Btn
                        size="sm"
                        onClick={() => {
                          t.markRead(n.id);
                          router.push(href);
                        }}
                      >
                        Open
                      </Btn>
                    )}
                    {!n.read && (
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => t.markRead(n.id)}
                      >
                        Mark as read
                      </Btn>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
