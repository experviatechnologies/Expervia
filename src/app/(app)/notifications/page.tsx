import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

type NotificationType =
  | "mention"
  | "comment"
  | "reaction"
  | "message"
  | "pod_activity";

function describe(
  type: NotificationType,
  actor: string,
  targetId: string | null,
): { text: string; href: string; Icon: LucideIcon } {
  switch (type) {
    case "comment":
      return {
        text: `${actor} commented on your post`,
        href: targetId ? `/feed/${targetId}` : "/feed",
        Icon: MessageSquare,
      };
    case "reaction":
      return {
        text: `${actor} reacted to your post`,
        href: targetId ? `/feed/${targetId}` : "/feed",
        Icon: ThumbsUp,
      };
    case "message":
      return {
        text: `${actor} sent you a message`,
        href: targetId ? `/messages/${targetId}` : "/messages",
        Icon: MessageSquare,
      };
    case "mention":
      return {
        text: `${actor} mentioned you`,
        href: targetId ? `/feed/${targetId}` : "/feed",
        Icon: Sparkles,
      };
    default:
      return { text: `${actor} — pod activity`, href: "/pods", Icon: Bell };
  }
}

export default async function NotificationsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, actor_id, target_type, target_id, is_read, created_at")
    .eq("recipient_id", member.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = rows ?? [];
  const actorIds = [
    ...new Set(notifications.map((n) => n.actor_id).filter(Boolean)),
  ] as string[];
  const { data: actorRows } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", actorIds)
    : { data: [] };
  const nameById = new Map(
    (actorRows ?? []).map((a) => [a.member_id, a.full_name]),
  );

  // Mark everything read now that it's on screen (the current render still shows
  // which were unread).
  if (notifications.some((n) => !n.is_read)) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", member.id)
      .eq("is_read", false);
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
          ETEN
        </p>
        <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
          Notifications
        </h1>
      </header>

      {notifications.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <Bell className="text-on-surface-variant/40 size-9" />
          <p className="text-sm">
            You&apos;re all caught up. Activity on your posts and messages shows
            up here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const actor = n.actor_id
              ? (nameById.get(n.actor_id) ?? "A member")
              : "Someone";
            const { text, href, Icon } = describe(
              n.type as NotificationType,
              actor,
              n.target_id,
            );
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={
                    n.is_read
                      ? "glass-card flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-white/5"
                      : "glass-card border-primary/30 bg-primary/5 flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-white/5"
                  }
                >
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-on-surface block text-sm">
                      {text}
                    </span>
                    <span className="text-on-surface-variant text-xs">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                  {!n.is_read && (
                    <span className="bg-primary size-2 shrink-0 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
